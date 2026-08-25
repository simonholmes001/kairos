// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "KairosApp",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(name: "KairosApp", targets: ["KairosApp"])
    ],
    targets: [
        .target(name: "KairosApp"),
        .testTarget(name: "KairosAppTests", dependencies: ["KairosApp"])
    ]
)
