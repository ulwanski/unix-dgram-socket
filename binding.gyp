{
  'targets': [
    {
      'target_name': 'unix_dgram',
      'sources': [ 'lib/unix_dgram.cc' ],
      'include_dirs': [
        '<!(node -e "require(\'nan\')")'
      ]
    }
  ]
}