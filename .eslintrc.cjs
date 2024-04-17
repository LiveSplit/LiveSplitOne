module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true
    },
    "extends": [
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking"
    ],
    "ignorePatterns":  [
        "src/livesplit-core/**",
        "src/type-definitions/**"
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "project": "tsconfig.json",
        "sourceType": "module"
    },
    "plugins": [
        "eslint-plugin-import",
        "eslint-plugin-jsdoc",
        "@typescript-eslint"
    ],
    "root": true,
    "rules": {
        "@typescript-eslint/adjacent-overload-signatures": "error",
        "@typescript-eslint/array-type": [
            "error",
            {
                "default": "array-simple"
            }
        ],
        "@typescript-eslint/ban-types": [
            "error",
            {
                "types": {
                    "Object": {
                        "message": "Avoid using the `Object` type. Did you mean `object`?"
                    },
                    "Function": {
                        "message": "Avoid using the `Function` type. Prefer a specific function type, like `() => void`."
                    },
                    "Boolean": {
                        "message": "Avoid using the `Boolean` type. Did you mean `boolean`?"
                    },
                    "Number": {
                        "message": "Avoid using the `Number` type. Did you mean `number`?"
                    },
                    "String": {
                        "message": "Avoid using the `String` type. Did you mean `string`?"
                    },
                    "Symbol": {
                        "message": "Avoid using the `Symbol` type. Did you mean `symbol`?"
                    }
                }
            }
        ],
        "@typescript-eslint/consistent-type-assertions": "error",
        "@typescript-eslint/dot-notation": "error",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/naming-convention": [
            "off",
            {
                "selector": "variable",
                "format": [
                    "camelCase",
                    "UPPER_CASE"
                ],
                "leadingUnderscore": "forbid",
                "trailingUnderscore": "forbid"
            }
        ],
        "@typescript-eslint/no-empty-function": "error",
        "@typescript-eslint/no-empty-interface": "error",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-floating-promises": "off",
        "@typescript-eslint/no-misused-new": "error",
        "@typescript-eslint/no-misused-promises": "off",
        "@typescript-eslint/no-namespace": "error",
        "@typescript-eslint/no-parameter-properties": "off",
        "@typescript-eslint/no-redundant-type-constituents": "off",
        "@typescript-eslint/no-shadow": [
            "off",
            {
                "hoist": "all"
            }
        ],
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-unused-expressions": "error",
        "@typescript-eslint/no-unused-vars": [
            "error",
            {
                "argsIgnorePattern": "^_"
            }
        ],
        "@typescript-eslint/no-use-before-define": "off",
        "@typescript-eslint/no-var-requires": "error",
        "@typescript-eslint/prefer-for-of": "error",
        "@typescript-eslint/prefer-function-type": "error",
        "@typescript-eslint/prefer-namespace-keyword": "error",
        "@typescript-eslint/semi": [
            "error",
            "always"
        ],
        "@typescript-eslint/triple-slash-reference": [
            "error",
            {
                "path": "always",
                "types": "prefer-import",
                "lib": "always"
            }
        ],
        "@typescript-eslint/typedef": "off",
        "@typescript-eslint/unified-signatures": "error",
        "complexity": "off",
        "constructor-super": "error",
        "dot-notation": "off",
        "eqeqeq": [
            "error",
            "smart"
        ],
        "guard-for-in": "error",
        "id-denylist": "off",
        "id-match": "off",
        "import/order": [
            "off",
            {
                "alphabetize": {
                    "caseInsensitive": true,
                    "order": "asc"
                },
                "newlines-between": "ignore",
                "groups": [
                    [
                        "builtin",
                        "external",
                        "internal",
                        "unknown",
                        "object",
                        "type"
                    ],
                    "parent",
                    [
                        "sibling",
                        "index"
                    ]
                ],
                "distinctGroup": false,
                "pathGroupsExcludedImportTypes": [],
                "pathGroups": [
                    {
                        "pattern": "./",
                        "patternOptions": {
                            "nocomment": true,
                            "dot": true
                        },
                        "group": "sibling",
                        "position": "before"
                    },
                    {
                        "pattern": ".",
                        "patternOptions": {
                            "nocomment": true,
                            "dot": true
                        },
                        "group": "sibling",
                        "position": "before"
                    },
                    {
                        "pattern": "..",
                        "patternOptions": {
                            "nocomment": true,
                            "dot": true
                        },
                        "group": "parent",
                        "position": "before"
                    },
                    {
                        "pattern": "../",
                        "patternOptions": {
                            "nocomment": true,
                            "dot": true
                        },
                        "group": "parent",
                        "position": "before"
                    }
                ]
            }
        ],
        "jsdoc/check-alignment": "error",
        "jsdoc/check-indentation": "error",
        "max-classes-per-file": "off",
        "new-parens": "error",
        "no-bitwise": "error",
        "no-caller": "error",
        "no-cond-assign": "error",
        "no-console": "error",
        "no-debugger": "error",
        "no-empty": "error",
        "no-empty-function": "off",
        "no-eval": "error",
        "no-fallthrough": "off",
        "no-invalid-this": "error",
        "no-new-wrappers": "error",
        "no-shadow": "off",
        "no-throw-literal": "error",
        "no-trailing-spaces": "error",
        "no-undef-init": "error",
        "no-underscore-dangle": "off",
        "no-unsafe-finally": "error",
        "no-unused-expressions": "off",
        "no-unused-labels": "error",
        "no-use-before-define": "off",
        "no-var": "error",
        "object-shorthand": "error",
        "one-var": [
            "error",
            "never"
        ],
        "prefer-const": "error",
        "prefer-object-spread": "error",
        "radix": "error",
        "semi": "off",
        "spaced-comment": [
            "error",
            "always",
            {
                "markers": [
                    "/"
                ]
            }
        ],
        "use-isnan": "error",
        "valid-typeof": "off"
    }
};
