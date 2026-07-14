# The Flutter tooling requires that developers have CMake 3.10 or later
# installed. You should not increase this version, as doing so will cause
# the plugin to fail to compile for some customers of the plugin.
cmake_minimum_required(VERSION 3.10)

project(pine_flutter_library VERSION 0.0.1)

file(GLOB_RECURSE SPINE_SOURCES "spine-cpp/src/**/*.cpp")
file(GLOB_RECURSE SPINE_C_SOURCES "spine-c/src/*.cpp")

add_library(spine_flutter SHARED
  ${SPINE_SOURCES}
  ${SPINE_C_SOURCES}
)

set_target_properties(spine_flutter PROPERTIES
  PUBLIC_HEADER spine-cpp-lite/spine_flutter.h
  OUTPUT_NAME "spine_flutter"
  CXX_STANDARD 11
  CXX_STANDARD_REQUIRED ON
)
target_include_directories(spine_flutter PUBLIC spine-cpp/include spine-c/include spine-c/src spine-c/src/generated)
target_compile_definitions(spine_flutter PUBLIC DART_SHARED_LIB)