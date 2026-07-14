/******************************************************************************
 * Spine Runtimes License Agreement
 * Last updated April 5, 2025. Replaces all prior versions.
 *
 * Copyright (c) 2013-2025, Esoteric Software LLC
 *
 * Integration of the Spine Runtimes into software or otherwise creating
 * derivative works of the Spine Runtimes is permitted under the terms and
 * conditions of Section 2 of the Spine Editor License Agreement:
 * http://esotericsoftware.com/spine-editor-license
 *
 * Otherwise, it is permitted to integrate the Spine Runtimes into software
 * or otherwise create derivative works of the Spine Runtimes (collectively,
 * "Products"), provided that each user of the Products must obtain their own
 * Spine Editor license and redistribution of the Products in any form must
 * include this license and copyright notice.
 *
 * THE SPINE RUNTIMES ARE PROVIDED BY ESOTERIC SOFTWARE LLC "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL ESOTERIC SOFTWARE LLC BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES,
 * BUSINESS INTERRUPTION, OR LOSS OF USE, DATA, OR PROFITS) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THE SPINE RUNTIMES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *****************************************************************************/

import Foundation
import SpineC

// MARK: - Version

/// The major version of the Spine runtime
public var majorVersion: Int {
    return Int(spine_major_version())
}

/// The minor version of the Spine runtime
public var minorVersion: Int {
    return Int(spine_minor_version())
}

/// The full version string of the Spine runtime
public var version: String {
    return "\(majorVersion).\(minorVersion)"
}

// MARK: - Debug

/// Enable or disable the debug extension for memory leak detection
public func enableDebugExtension(_ enable: Bool) {
    spine_enable_debug_extension(enable)
}

/// Report any memory leaks detected by the debug extension
public func reportLeaks() {
    spine_report_leaks()
}

// MARK: - Atlas Loading

/// Load an Atlas from atlas data string
public func loadAtlas(_ atlasData: String) throws -> Atlas {
    let result = spine_atlas_load(atlasData)

    // Check for error
    if let errorPtr = spine_atlas_result_get_error(result) {
        let error = String(cString: errorPtr)
        spine_atlas_result_dispose(result)
        throw SpineError("Couldn't load atlas: \(error)")
    }

    // Get atlas
    guard let atlasPtr = spine_atlas_result_get_atlas(result) else {
        spine_atlas_result_dispose(result)
        throw SpineError("Couldn't get atlas from result")
    }

    let atlas = Atlas(fromPointer: atlasPtr)
    spine_atlas_result_dispose(result)
    return atlas
}

// MARK: - SkeletonData Loading

/// Load skeleton data from JSON string
public func loadSkeletonDataJson(atlas: Atlas, jsonData: String, path: String = "") throws -> SkeletonData {
    let result = spine_skeleton_data_load_json(atlas._ptr.assumingMemoryBound(to: spine_atlas_wrapper.self), jsonData, path)

    // Check for error
    if let errorPtr = spine_skeleton_data_result_get_error(result) {
        let error = String(cString: errorPtr)
        spine_skeleton_data_result_dispose(result)
        throw SpineError("Couldn't load skeleton data: \(error)")
    }

    // Get skeleton data
    guard let skeletonDataPtr = spine_skeleton_data_result_get_data(result) else {
        spine_skeleton_data_result_dispose(result)
        throw SpineError("Couldn't get skeleton data from result")
    }

    let skeletonData = SkeletonData(fromPointer: skeletonDataPtr)
    spine_skeleton_data_result_dispose(result)
    return skeletonData
}

/// Load skeleton data from binary data
public func loadSkeletonDataBinary(atlas: Atlas, binaryData: Data, path: String = "") throws -> SkeletonData {
    let result = binaryData.withUnsafeBytes { buffer in
        spine_skeleton_data_load_binary(
            atlas._ptr.assumingMemoryBound(to: spine_atlas_wrapper.self),
            buffer.bindMemory(to: UInt8.self).baseAddress,
            Int32(buffer.count),
            path
        )
    }

    // Check for error
    if let errorPtr = spine_skeleton_data_result_get_error(result) {
        let error = String(cString: errorPtr)
        spine_skeleton_data_result_dispose(result)
        throw SpineError("Couldn't load skeleton data: \(error)")
    }

    // Get skeleton data
    guard let skeletonDataPtr = spine_skeleton_data_result_get_data(result) else {
        spine_skeleton_data_result_dispose(result)
        throw SpineError("Couldn't get skeleton data from result")
    }

    let skeletonData = SkeletonData(fromPointer: skeletonDataPtr)
    spine_skeleton_data_result_dispose(result)
    return skeletonData
}

// MARK: - Error Type

public struct SpineError: Error, CustomStringConvertible {
    public let description: String

    public init(_ description: String) {
        self.description = description
    }
}
