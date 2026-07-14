# spine-sfml

The spine-sfml runtime provides functionality to load, manipulate and render [Spine](http://esotericsoftware.com) skeletal animation data using [SFML](https://www.sfml-dev.org/). spine-sfml is based on [spine-cpp](../spine-cpp).

# See the [spine-sfml documentation](http://esotericsoftware.com/spine-sfml) for in-depth information

## Licensing

You are welcome to evaluate the Spine Runtimes and the examples we provide in this repository free of charge.

You can integrate the Spine Runtimes into your software free of charge, but users of your software must have their own [Spine license](https://esotericsoftware.com/spine-purchase). Please make your users aware of this requirement! This option is often chosen by those making development tools, such as an SDK, game toolkit, or software library.

In order to distribute your software containing the Spine Runtimes to others that don't have a Spine license, you need a [Spine license](https://esotericsoftware.com/spine-purchase) at the time of integration. Then you can distribute your software containing the Spine Runtimes however you like, provided others don't modify it or use it to create new software. If others want to do that, they'll need their own Spine license.

For the official legal terms governing the Spine Runtimes, please read the [Spine Runtimes License Agreement](http://esotericsoftware.com/spine-runtimes-license) and Section 2 of the [Spine Editor License Agreement](http://esotericsoftware.com/spine-editor-license#s2).

## Spine version

spine-sfml works with data exported from Spine 4.3.xx.

spine-sfml supports all Spine features.

## Usage

### Integration with CMake (Recommended)

The easiest way to integrate spine-sfml into your project is via CMake FetchContent:

```cmake
include(FetchContent)
FetchContent_Declare(
    spine-sfml
    GIT_REPOSITORY https://github.com/esotericsoftware/spine-runtimes.git
    GIT_TAG 4.3
    SOURCE_SUBDIR spine-sfml
)
FetchContent_MakeAvailable(spine-sfml)

# Link against spine-sfml
target_link_libraries(your_target spine-sfml)
```

This will automatically fetch and build spine-sfml along with its dependencies (spine-cpp and SFML).

### Manual Integration

If you prefer manual integration:

1. Download the Spine Runtimes source using git (`git clone https://github.com/esotericsoftware/spine-runtimes`) or download it as a zip.
2. Add the required source files to your project:
   - Add sources from `spine-cpp/src` and `spine-sfml/src/spine-sfml.cpp`
3. Add the include directories: `spine-cpp/include` and `spine-sfml/src`
4. Link against SFML libraries

See the [Spine Runtimes documentation](http://esotericsoftware.com/spine-documentation#runtimes) for detailed API usage.

## Examples

The repository includes example code:
- C++ example: [example/main.cpp](example/main.cpp)

### Building the Examples

### Windows

1. Install [Visual Studio Community](https://visualstudio.microsoft.com/downloads/). Make sure you install support for C++ and CMake.
2. Download the Spine Runtimes repository using git (`git clone https://github.com/esotericsoftware/spine-runtimes`) or download it as a zip.
3. Open Visual Studio Community, then open `spine-sfml/` via the **Open a local folder** button in the Visual Studio Community launcher.
4. Wait for CMake to finish, then select `spine-sfml-example.exe` as the start-up project and start debugging.

### Linux

1. Install dependencies:
   ```bash
   sudo apt-get install cmake ninja-build libsfml-dev  # Ubuntu/Debian
   # or equivalent for your distribution
   ```
2. Clone the repository: `git clone https://github.com/esotericsoftware/spine-runtimes`
3. Build and run:
   ```bash
   cd spine-runtimes/spine-sfml
   ./build.sh
   ./build/debug/spine-sfml-example
   ```

### macOS

1. Install [Xcode](https://developer.apple.com/xcode/)
2. Install [Homebrew](http://brew.sh/)
3. Install dependencies:
   ```bash
   brew install cmake ninja
   ```
4. Clone the repository: `git clone https://github.com/esotericsoftware/spine-runtimes`
5. Build and run:
   ```bash
   cd spine-runtimes/spine-sfml
   ./build.sh
   ./build/debug/spine-sfml-example
   ```