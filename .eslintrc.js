module.exports = {
    "plugins": [
        "security",
        "mocha"
    ],
    "extends": [
        "eslint:recommended",
        "plugin:node/recommended",
        "plugin:security/recommended"
    ],
    "rules": {
        "node/exports-style": ["error", "module.exports"],
        "node/prefer-global/buffer": ["error", "always"],
        "node/prefer-global/console": ["error", "always"],
        "node/prefer-global/process": ["error", "always"],
        "node/prefer-global/url-search-params": ["error", "always"],
        "node/prefer-global/url": ["error", "always"],
        "node/no-deprecated-api": ["error", {
            "ignoreModuleItems": [],
            "ignoreGlobalItems": []
        }],
        "mocha/no-exclusive-tests": "error"
    }
};
