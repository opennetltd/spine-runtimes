cmake_minimum_required(VERSION 3.16)
project(spine-sfml VERSION 4.3.0 LANGUAGES C CXX)

option(BUILD_EXAMPLES "Build examples" ON)

# Default flags
include(${CMAKE_CURRENT_LIST_DIR}/../flags.cmake)

# SFML
include(FetchContent)
set(BUILD_SHARED_LIBS OFF)
FetchContent_Declare(
    SFML
    GIT_REPOSITORY https://github.com/SFML/SFML
    GIT_TAG 2.6.1
)
FetchContent_MakeAvailable(SFML)


add_subdirectory(${CMAKE_CURRENT_LIST_DIR}/../spine-cpp ${CMAKE_BINARY_DIR}/spine-cpp)

# spine-sfml library (C++ only since SFML is a C++ library)
add_library(spine-sfml STATIC
    src/spine-sfml.cpp
    src/spine-sfml.h)
target_include_directories(spine-sfml PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/src>
    $<INSTALL_INTERFACE:include>)
target_link_libraries(spine-sfml
    PUBLIC spine-cpp sfml-graphics sfml-window sfml-system)

# Example
if(BUILD_EXAMPLES)
    add_executable(spine-sfml-example example/main.cpp)
    target_link_libraries(spine-sfml-example spine-sfml)

    # Copy data to build directory
    add_custom_command(TARGET spine-sfml-example PRE_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_directory
        ${CMAKE_CURRENT_LIST_DIR}/data $<TARGET_FILE_DIR:spine-sfml-example>/data)
endif()