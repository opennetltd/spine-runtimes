# spine-ios

The spine-ios runtime provides functionality to load, manipulate and render [Spine](http://esotericsoftware.com) skeletal animation data for iOS, tvOS, macOS, and visionOS using Swift or Objective-C. spine-ios is based on [spine-c](../spine-c) and [spine-cpp](../spine-cpp).

# See the [spine-ios documentation](http://esotericsoftware.com/spine-ios) for in-depth information

## Licensing

You are welcome to evaluate the Spine Runtimes and the examples we provide in this repository free of charge.

You can integrate the Spine Runtimes into your software free of charge, but users of your software must have their own [Spine license](https://esotericsoftware.com/spine-purchase). Please make your users aware of this requirement! This option is often chosen by those making development tools, such as an SDK, game toolkit, or software library.

In order to distribute your software containing the Spine Runtimes to others that don't have a Spine license, you need a [Spine license](https://esotericsoftware.com/spine-purchase) at the time of integration. Then you can distribute your software containing the Spine Runtimes however you like, provided others don't modify it or use it to create new software. If others want to do that, they'll need their own Spine license.

For the official legal terms governing the Spine Runtimes, please read the [Spine Runtimes License Agreement](http://esotericsoftware.com/spine-runtimes-license) and Section 2 of the [Spine Editor License Agreement](http://esotericsoftware.com/spine-editor-license#s2).

## Spine version

spine-ios works with data exported from Spine 4.3.xx.

spine-ios supports all Spine features except two-color tinting.

## Usage

### Integration with Swift Package Manager

Add spine-ios to your Xcode project or Package.swift:

#### Via Xcode

1. Open your project in Xcode
2. Go to File → Add Package Dependencies
3. Enter the repository URL: `https://github.com/esotericsoftware/spine-runtimes.git`
4. Choose the version (e.g., branch "4.3")
5. Select the libraries you need:
   - `SpineC` - C API for low-level access
   - `SpineSwift` - Swift API for Swift projects
   - `SpineiOS` - iOS/tvOS rendering with Metal

#### Via Package.swift

```swift
dependencies: [
    .package(url: "https://github.com/esotericsoftware/spine-runtimes.git", branch: "4.3")
],
targets: [
    .target(
        name: "YourTarget",
        dependencies: [
            .product(name: "SpineiOS", package: "spine-runtimes"),
            // Or use SpineSwift for cross-platform Swift-only code:
            // .product(name: "SpineSwift", package: "spine-runtimes"),
        ]
    )
]
```

## Examples

The repository includes comprehensive example code demonstrating various features:
- Simple animation playback
- Animation state events
- Physics simulation
- IK following
- Mix-and-match skins
- Debug rendering
- Objective-C integration

### Running the Examples

#### Requirements
- Xcode 14.0 or later
- iOS 13.0+ / tvOS 13.0+ / macOS 10.15+ device or simulator

#### Steps
1. Clone the repository: `git clone https://github.com/esotericsoftware/spine-runtimes`
2. Open the example project:
   ```bash
   cd spine-runtimes/spine-ios
   open Example/Spine\ iOS\ Example.xcodeproj
   ```
3. Select your target device (simulator or physical device)
4. Press Run (⌘R) to build and run the examples

The example app includes multiple tabs showcasing different spine-ios features.

## Development

For developers who want to modify or build spine-ios from source:

### Building the Modules

```bash
cd spine-runtimes/spine-ios

# Build SpineC (C API)
swift build --product SpineC

# Build SpineSwift (Swift API)
swift build --product SpineSwift

# Build SpineiOS (requires iOS/tvOS SDK)
# Use Xcode for SpineiOS as it requires platform-specific SDKs
```

### Running Tests

```bash
cd spine-runtimes/spine-ios/test
swift build
swift run SpineTest
```

### Generating Swift Bindings

If you need to regenerate the Swift bindings after modifying spine-c:

```bash
cd spine-runtimes/spine-ios
./generate-bindings.sh
```

This will regenerate the Swift wrapper code in `Sources/SpineSwift/Generated/`.