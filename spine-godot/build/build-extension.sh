#!/bin/bash
set -e

dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
pushd "$dir" > /dev/null

if [ ! -d ../godot-cpp ]; then
	echo "No godot-cpp clone found. Run ./setup-extension.sh <Godot branch or tag> <dev> first."
	exit 1
fi

options=""
dev="false"
platform=${1%/}

if [ -f "../godot-cpp/dev" ]; then
	dev="true"
	echo "DEV build"
fi

if [ $dev == "true" ]; then	
    options="$options dev_build=true"
fi

if [ -z $platform ]; then
    echo "Platform: current"
else
    echo "Platform: $platform"
    platform="platform=$platform"    
fi

cpus=2
if [ "$OSTYPE" == "msys" ]; then
	os="windows"
	cpus=$NUMBER_OF_PROCESSORS		
elif [[ "$OSTYPE" == "darwin"* ]]; then
	os="macos"
	cpus=$(sysctl -n hw.logicalcpu)	
	if [ `uname -m` == "arm64" ]; then
        echo "Would do Apple Silicon specific setup"	
	fi
else
	os="linux"
	cpus=$(grep -c ^processor /proc/cpuinfo)
fi

echo "CPUS: $cpus"

pushd ..
scons -j $cpus $options $platform target=editor
scons -j $cpus $options $platform target=template_debug
scons -j $cpus $options $platform target=template_release
popd

popd