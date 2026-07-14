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

// MARK: - BonePose Extensions

extension BonePose {
    /// Transform world coordinates to local coordinates
    public func worldToLocal(worldX: Float, worldY: Float) -> Vector {
        let output = ArrayFloat()
        spine_bone_pose_world_to_local_v(
            _ptr.assumingMemoryBound(to: spine_bone_pose_wrapper.self),
            worldX, worldY,
            output._ptr.assumingMemoryBound(to: spine_array_float_wrapper.self))
        let vector = Vector(x: output[0], y: output[1])
        return vector
    }

    /// Transform local coordinates to world coordinates
    public func localToWorld(localX: Float, localY: Float) -> Vector {
        let output = ArrayFloat()
        spine_bone_pose_local_to_world_v(
            _ptr.assumingMemoryBound(to: spine_bone_pose_wrapper.self),
            localX, localY,
            output._ptr.assumingMemoryBound(to: spine_array_float_wrapper.self))
        let vector = Vector(x: output[0], y: output[1])
        return vector
    }

    /// Transform world coordinates to parent coordinates
    public func worldToParent(worldX: Float, worldY: Float) -> Vector {
        let output = ArrayFloat()
        spine_bone_pose_world_to_parent_v(
            _ptr.assumingMemoryBound(to: spine_bone_pose_wrapper.self),
            worldX, worldY,
            output._ptr.assumingMemoryBound(to: spine_array_float_wrapper.self))
        let vector = Vector(x: output[0], y: output[1])
        return vector
    }

    /// Transform parent coordinates to world coordinates
    public func parentToWorld(parentX: Float, parentY: Float) -> Vector {
        let output = ArrayFloat()
        spine_bone_pose_parent_to_world_v(
            _ptr.assumingMemoryBound(to: spine_bone_pose_wrapper.self),
            parentX, parentY,
            output._ptr.assumingMemoryBound(to: spine_array_float_wrapper.self))
        let vector = Vector(x: output[0], y: output[1])
        return vector
    }
}
