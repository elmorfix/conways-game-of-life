import baseConfig from "../../eslint.config.mjs";

export default [
    ...baseConfig,
    {
        files: [
            "**/*.ts",
            "**/*.tsx",
            "**/*.js",
            "**/*.jsx"
        ],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    paths: [
                        {
                            name: "react",
                            message: "libs/sim must remain framework-agnostic and cannot import React."
                        },
                        {
                            name: "react-dom",
                            message: "libs/sim must remain framework-agnostic and cannot import React DOM."
                        },
                        {
                            name: "next",
                            message: "libs/sim cannot import Next.js runtime APIs."
                        },
                        {
                            name: "@nestjs/common",
                            message: "libs/sim cannot depend on NestJS."
                        },
                        {
                            name: "@nestjs/core",
                            message: "libs/sim cannot depend on NestJS."
                        }
                    ],
                    patterns: [
                        {
                            group: [
                                "next/*",
                                "@nestjs/*"
                            ],
                            message: "libs/sim must remain pure and framework-free."
                        }
                    ]
                }
            ]
        }
    },
    {
        files: [
            "**/*.json"
        ],
        rules: {
            "@nx/dependency-checks": [
                "error",
                {
                    ignoredFiles: [
                        "{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}"
                    ]
                }
            ]
        },
        languageOptions: {
            parser: await import("jsonc-eslint-parser")
        }
    },
    {
        ignores: [
            "**/out-tsc"
        ]
    }
];
