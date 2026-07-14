import Foundation
import SpineC
import SpineSwift

print("Spine-C test package is working!")
print("Spine version: \(spine_major_version()).\(spine_minor_version())")

// Run the original C API test
print("\n=== Testing C API directly ===")
runSkeletonDrawableTest()

// Run the new SpineSwift API test
print("\n=== Testing SpineSwift API ===")
print("Starting SpineSwift test...")
print("About to call runSkeletonDrawableTestSwift...")
runSkeletonDrawableTestSwift()
print("SpineSwift test completed")
