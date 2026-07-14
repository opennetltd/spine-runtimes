# spine-glfw

The spine-glfw runtime provides functionality to load, manipulate and render [Spine](http://esotericsoftware.com) skeletal animation data using [GLFW](https://www.glfw.org/) and OpenGL. spine-glfw is based on [spine-c](../spine-c) and [spine-cpp](../spine-cpp). Note that spine-c depends on spine-cpp, so both are required regardless of which API you choose to use.

# See the [spine-glfw documentation](http://esotericsoftware.com/spine-glfw) for in-depth information

## Licensing

You are welcome to evaluate the Spine Runtimes and the examples we provide in this repository free of charge.

You can integrate the Spine Runtimes into your software free of charge, but users of your software must have their own [Spine license](https://esotericsoftware.com/spine-purchase). Please make your users aware of this requirement! This option is often chosen by those making development tools, such as an SDK, game toolkit, or software library.

In order to distribute your software containing the Spine Runtimes to others that don't have a Spine license, you need a [Spine license](https://esotericsoftware.com/spine-purchase) at the time of integration. Then you can distribute your software containing the Spine Runtimes however you like, provided others don't modify it or use it to create new software. If others want to do that, they'll need their own Spine license.

For the official legal terms governing the Spine Runtimes, please read the [Spine Runtimes License Agreement](http://esotericsoftware.com/spine-runtimes-license) and Section 2 of the [Spine Editor License Agreement](http://esotericsoftware.com/spine-editor-license#s2).

## Spine version

spine-glfw works with data exported from Spine 4.3.xx.

spine-glfw supports all Spine features.

## Usage

### Integration with CMake (Recommended)

The easiest way to integrate spine-glfw into your project is via CMake FetchContent:

```cmake
include(FetchContent)
FetchContent_Declare(
    spine-glfw
    GIT_REPOSITORY https://github.com/esotericsoftware/spine-runtimes.git
    GIT_TAG 4.3
    SOURCE_SUBDIR spine-glfw
)
FetchContent_MakeAvailable(spine-glfw)

# Link against spine-glfw (includes both C and C++ APIs)
target_link_libraries(your_target spine-glfw)
```

This will automatically fetch and build spine-glfw along with its dependencies (spine-c, spine-cpp, GLFW, and glbinding).

### Manual Integration

If you prefer manual integration:

1. Download the Spine Runtimes source using git (`git clone https://github.com/esotericsoftware/spine-runtimes`) or download it as a zip.
2. Add the required source files to your project:
   - Add sources from `spine-cpp/src`, `spine-c/src`, and `spine-glfw/src`
3. Add the include directories: `spine-cpp/include`, `spine-c/include`, and `spine-glfw/src`
4. Link against GLFW and OpenGL libraries

See the [Spine Runtimes documentation](http://esotericsoftware.com/spine-documentation#runtimes) for detailed API usage.

## Examples

The repository includes example code for both C and C++ APIs:
- C example: [example/main-c.cpp](example/main-c.cpp)
- C++ example: [example/main.cpp](example/main.cpp)

### Windows

1. Install [Visual Studio Community](https://visualstudio.microsoft.com/downloads/). Make sure you install support for C++ and CMake.
2. Download the Spine Runtimes repository using git (`git clone https://github.com/esotericsoftware/spine-runtimes`) or download it as a zip.
3. Open Visual Studio Community, then open `spine-glfw/` via the **Open a local folder** button in the Visual Studio Community launcher.
4. Wait for CMake to finish, then select either `spine-glfw-example.exe` or `spine-glfw-example-c.exe` as the start-up project and start debugging.

### Linux

1. Install dependencies:
   ```bash
   sudo apt-get install cmake ninja-build libgl1-mesa-dev libx11-dev libxrandr-dev libxinerama-dev libxcursor-dev libxi-dev  # Ubuntu/Debian
   # or equivalent for your distribution
   ```
2. Clone the repository: `git clone https://github.com/esotericsoftware/spine-runtimes`
3. Build and run:
   ```bash
   cd spine-runtimes/spine-glfw
   ./build.sh
   ./build/debug/spine-glfw-example-c    # Run C example
   ./build/debug/spine-glfw-example      # Run C++ example
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
   cd spine-runtimes/spine-glfw
   ./build.sh
   ./build/debug/spine-glfw-example-c    # Run C example
   ./build/debug/spine-glfw-example      # Run C++ example
   ```