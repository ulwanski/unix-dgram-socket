#undef  _GNU_SOURCE
#define _GNU_SOURCE     // -D_GNU_SOURCE makes SOCK_NONBLOCK etc. available on linux

#include <nan.h>
#include <node.h>
#include <sys/un.h>
#include <map>

#if defined(WIN32) || defined(_WIN32) || defined(__WIN32__) || defined(__NT__)
#include <io.h>
#else
#include <unistd.h>
#endif

#define offset_of(type, member) ((intptr_t) ((char *) &(((type *) 8)->member) - 8))
#define container_of(ptr, type, member) ((type *) ((char *) (ptr) - offset_of(type, member)))

using namespace v8;
using namespace Nan;

namespace {
    struct SocketContext {
      Nan::Callback recv_cb_;
      Nan::Callback writable_cb_;
      uv_poll_t handle_;
      int fd_;
    };

    void OnEvent(uv_poll_t* handle, int status, int events);
    typedef std::map<int, SocketContext*> watchers_t;
    watchers_t watchers;

    inline void SetNonBlock(int fd) {
      int flags;
      int r;

      flags = fcntl(fd, F_GETFL);
      assert(flags != -1);

      r = fcntl(fd, F_SETFL, flags | O_NONBLOCK);
      assert(r != -1);
    }

    inline void SetCloExec(int fd) {
      int flags;
      int r;

      flags = fcntl(fd, F_GETFD);
      assert(flags != -1);

      r = fcntl(fd, F_SETFD, flags | FD_CLOEXEC);
      assert(r != -1);
    }

    void OnRecv(SocketContext* sc) {
      Nan::HandleScope scope;
      Local<Value> argv[3];
      msghdr msg;
      iovec iov;
      ssize_t err;
      char scratch[65536];

      /* Union to avoid breaking strict-aliasing rules */
      union {
        struct sockaddr_un s;
        struct sockaddr_storage ss;
      } u_addr;

      argv[0] = argv[1] = argv[2] = Nan::Null();

      iov.iov_base = scratch;
      iov.iov_len = sizeof scratch;

      // If first byte is zero, it could be abstract socket namespace path, so second byte must be check
      u_addr.s.sun_path[0] = '\0';
      u_addr.s.sun_path[1] = '\0';

      memset(&msg, 0, sizeof msg);
      msg.msg_iovlen = 1;
      msg.msg_iov = &iov;
      msg.msg_name = &u_addr.ss;
      msg.msg_namelen = sizeof u_addr.ss;

      do {
        err = recvmsg(sc->fd_, &msg, 0);
      } while (err == -1 && errno == EINTR);

      if (err == -1) {
        err = -errno;
      } else {
        argv[1] = Nan::CopyBuffer(scratch, err).ToLocalChecked();
        if (u_addr.s.sun_path[0] == '\0' && u_addr.s.sun_path[1] != '\0') {
          u_addr.s.sun_path[0] = '@';
        }
        argv[2] = Nan::New<String>(u_addr.s.sun_path).ToLocalChecked();
      }

      argv[0] = Nan::New<Integer>(static_cast<int32_t>(err));

      Nan::Call(sc->recv_cb_, sizeof(argv) / sizeof(argv[0]), argv);
    }

    void OnWritable(SocketContext* sc) {
      Nan::HandleScope scope;
      uv_poll_start(&sc->handle_, UV_READABLE, OnEvent);
      Nan::Call(sc->writable_cb_, 0, NULL);
    }

    void OnEvent(uv_poll_t* handle, int status, int events) {
      assert(0 == status);
      assert(0 == (events & ~(UV_READABLE | UV_WRITABLE)));
      SocketContext* sc = container_of(handle, SocketContext, handle_);
      if (events & UV_READABLE)
        OnRecv(sc);

      if (events & UV_WRITABLE)
        OnWritable(sc);
    }

    void StartWatcher(int fd, Local<Value> recv_cb, Local<Value> writable_cb) {
      // start listening for incoming dgrams
      SocketContext* sc = new SocketContext;
      sc->recv_cb_.Reset(recv_cb.As<Function>());
      sc->writable_cb_.Reset(writable_cb.As<Function>());
      sc->fd_ = fd;

      uv_poll_init(uv_default_loop(), &sc->handle_, fd);
      uv_poll_start(&sc->handle_, UV_READABLE, OnEvent);

      // so we can disarm the watcher when close(fd) is called
      watchers.insert(watchers_t::value_type(fd, sc));
    }

    void FreeSocketContext(uv_handle_t* handle) {
      SocketContext* sc = container_of(handle, SocketContext, handle_);
      delete sc;
    }

    void StopWatcher(int fd) {
      watchers_t::iterator iter = watchers.find(fd);
      assert(iter != watchers.end());

      SocketContext* sc = iter->second;
      sc->recv_cb_.Reset();
      sc->writable_cb_.Reset();
      watchers.erase(iter);

      uv_poll_stop(&sc->handle_);
      uv_close(reinterpret_cast<uv_handle_t*>(&sc->handle_), FreeSocketContext);
    }


    NAN_METHOD(Socket) {
      Nan::HandleScope scope;
      Local<Value> recv_cb;
      Local<Value> writable_cb;
      int protocol;
      int domain;
      int type;
      int fd;

      assert(info.Length() == 5);

      domain      = Nan::To<int32_t>(info[0]).FromJust();
      type        = Nan::To<int32_t>(info[1]).FromJust();
      protocol    = Nan::To<int32_t>(info[2]).FromJust();
      recv_cb     = info[3];
      writable_cb = info[4];

      // type |= SOCK_NONBLOCK | SOCK_CLOEXEC;

      fd = socket(domain, type, protocol);
      if (fd == -1) {
        fd = -errno;
        goto out;
      }

     #if !defined(SOCK_NONBLOCK)
      SetNonBlock(fd);
    #endif
    #if !defined(SOCK_CLOEXEC)
      SetCloExec(fd);
    #endif

      StartWatcher(fd, recv_cb, writable_cb);

    out:
      info.GetReturnValue().Set(fd);
    }

    NAN_METHOD(Bind) {
      Nan::HandleScope scope;
      sockaddr_un s;
      int err;
      int fd;

      assert(info.Length() == 2);

      fd = Nan::To<int32_t>(info[0]).FromJust();
      Nan::Utf8String path(info[1]);

      memset(&s, 0, sizeof(s));
      strncpy(s.sun_path, *path, sizeof(s.sun_path) - 1);
      s.sun_family = AF_UNIX;

      // Replace @ for unix socket abstract namespace char '\0'
      if (s.sun_path[0] == '@') s.sun_path[0] = '\0';

      err = 0;
      if (bind(fd, reinterpret_cast<sockaddr*>(&s), sizeof(s)))
        err = -errno;

      info.GetReturnValue().Set(err);
    }

    NAN_METHOD(SendTo) {
      Nan::HandleScope scope;
      Local<Object> buf;
      sockaddr_un s;
      size_t offset;
      size_t length;
      msghdr msg;
      iovec iov;
      int err;
      int fd;
      int r;

      assert(info.Length() == 5);

      fd = Nan::To<int32_t>(info[0]).FromJust();
      buf = Nan::To<Object>(info[1]).ToLocalChecked();
      offset = Nan::To<uint32_t>(info[2]).FromJust();
      length = Nan::To<uint32_t>(info[3]).FromJust();
      Nan::Utf8String path(info[4]);

      assert(node::Buffer::HasInstance(buf));
      assert(offset + length <= node::Buffer::Length(buf));

      iov.iov_base = node::Buffer::Data(buf) + offset;
      iov.iov_len = length;

      memset(&s, 0, sizeof(s));
      strncpy(s.sun_path, *path, sizeof(s.sun_path) - 1);
      s.sun_family = AF_UNIX;

      // Replace @ for unix socket abstract namespace char '\0'
      if (s.sun_path[0] == '@') s.sun_path[0] = '\0';

      memset(&msg, 0, sizeof msg);
      msg.msg_iovlen = 1;
      msg.msg_iov = &iov;
      msg.msg_name = reinterpret_cast<void*>(&s);
      msg.msg_namelen = sizeof(s);

      do
        r = sendmsg(fd, &msg, 0);
      while (r == -1 && errno == EINTR);

      err = 0;
      if (r == -1)
        err = -errno;

      info.GetReturnValue().Set(err);
    }

    NAN_METHOD(Send) {
      Nan::HandleScope scope;
      Local<Object> buf;
      msghdr msg;
      iovec iov;
      int err;
      int fd;
      int r;

      assert(info.Length() == 2);

      fd = Nan::To<int32_t>(info[0]).FromJust();
      buf = Nan::To<Object>(info[1]).ToLocalChecked();
      assert(node::Buffer::HasInstance(buf));

      iov.iov_base = node::Buffer::Data(buf);
      iov.iov_len = node::Buffer::Length(buf);

      memset(&msg, 0, sizeof msg);
      msg.msg_iovlen = 1;
      msg.msg_iov = &iov;

      do
        r = sendmsg(fd, &msg, 0);
      while (r == -1 && errno == EINTR);

      err = 0;
      if (r == -1) {
        err = -errno;
        if ((errno == EAGAIN) || (errno == EWOULDBLOCK) || (errno == ENOBUFS)) {
          watchers_t::iterator iter = watchers.find(fd);
          assert(iter != watchers.end());
          SocketContext* sc = iter->second;
          uv_poll_start(&sc->handle_, UV_READABLE | UV_WRITABLE, OnEvent);
          err = 1;
        }
      }

      info.GetReturnValue().Set(err);
    }

    NAN_METHOD(Connect) {
      Nan::HandleScope scope;
      sockaddr_un s;
      int err;
      int fd;

      assert(info.Length() == 2);

      fd = Nan::To<int32_t>(info[0]).FromJust();
      Nan::Utf8String path(info[1]);

      memset(&s, 0, sizeof(s));
      strncpy(s.sun_path, *path, sizeof(s.sun_path) - 1);
      s.sun_family = AF_UNIX;

      // Replace @ for unix socket abstract namespace char '\0'
      if (s.sun_path[0] == '@') s.sun_path[0] = '\0';

      err = 0;
      if (connect(fd, reinterpret_cast<sockaddr*>(&s), sizeof(s)))
        err = -errno;

      info.GetReturnValue().Set(err);
    }


    NAN_METHOD(Close) {
      Nan::HandleScope scope;
      int err;
      int fd;

      assert(info.Length() == 1);
      fd = Nan::To<int32_t>(info[0]).FromJust();

      // Suppress EINTR and EINPROGRESS.  EINTR means that the close() system call
      // was interrupted by a signal.  According to POSIX, the file descriptor is
      // in an undefined state afterwards.  It's not safe to try closing it again
      // because it may have been closed, despite the signal.  If we call close()
      // again, then it would either:
      //
      //   a) fail with EBADF, or
      //
      //   b) close the wrong file descriptor if another thread or a signal handler
      //      has reused it in the mean time.
      //
      // Neither is what we want but scenario B is particularly bad.  Not retrying
      // the close() could, in theory, lead to file descriptor leaks but, in
      // practice, operating systems do the right thing and close the file
      // descriptor, regardless of whether the operation was interrupted by
      // a signal.
      //
      // EINPROGRESS is benign.  It means the close operation was interrupted but
      // that the file descriptor has been closed or is being closed in the
      // background.  It's informative, not an error.
      err = 0;
      if (close(fd))
        if (errno != EINTR && errno != EINPROGRESS)
          err = -errno;

      StopWatcher(fd);
      info.GetReturnValue().Set(err);
    }

    void Initialize(Local<Object> exports) {
      Nan::Set(exports, Nan::New("AF_UNIX").ToLocalChecked(), Nan::New(AF_UNIX));
      Nan::Set(exports, Nan::New("SOCK_DGRAM").ToLocalChecked(), Nan::New(SOCK_DGRAM));
      Nan::SetMethod(exports, "socket", Socket);
      Nan::SetMethod(exports, "bind", Bind);
      Nan::SetMethod(exports, "sendto", SendTo);
      Nan::SetMethod(exports, "send", Send);
      Nan::SetMethod(exports, "connect", Connect);
      Nan::SetMethod(exports, "close", Close);
    }

}

NODE_MODULE(unix_dgram, Initialize)