// swift-tools-version: 5.5
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "SpineTest",
    platforms: [
        .macOS(.v10_15)
    ],
    dependencies: [
        .package(path: "../../")
    ],
    targets: [
        .executableTarget(
            name: "SpineTest",
            dependencies: [
                .product(name: "SpineC", package: "spine-runtimes"),
                .product(name: "SpineSwift", package: "spine-runtimes"),
            ],
            path: "src"
        )
    ]
)
