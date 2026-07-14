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

// MARK: - Skin Extensions

extension Skin {
    /// Get all entries (slot/attachment pairs) in this skin
    public func getEntries() -> [SkinEntry] {
        guard let entriesPtr = spine_skin_get_entries(_ptr.assumingMemoryBound(to: spine_skin_wrapper.self)) else {
            return []
        }

        defer {
            spine_skin_entries_dispose(entriesPtr)
        }

        let numEntries = Int(spine_skin_entries_get_num_entries(entriesPtr))
        var entries: [SkinEntry] = []

        for i in 0..<numEntries {
            guard let entryPtr = spine_skin_entries_get_entry(entriesPtr, Int32(i)) else {
                continue
            }

            let slotIndex = Int(spine_skin_entry_get_slot_index(entryPtr))

            guard let namePtr = spine_skin_entry_get_name(entryPtr) else {
                continue
            }
            let name = String(cString: namePtr)

            let attachmentPtr = spine_skin_entry_get_attachment(entryPtr)
            var attachment: Attachment? = nil

            if let attachmentPtr = attachmentPtr {
                // Use RTTI to determine the concrete attachment type
                let rtti = spine_attachment_get_rtti(attachmentPtr)
                guard let classNamePtr = spine_rtti_get_class_name(rtti) else {
                    continue
                }
                let className = String(cString: classNamePtr)

                switch className {
                case "RegionAttachment":
                    attachment = RegionAttachment(
                        fromPointer: UnsafeMutableRawPointer(attachmentPtr).assumingMemoryBound(to: spine_region_attachment_wrapper.self))
                case "MeshAttachment":
                    attachment = MeshAttachment(
                        fromPointer: UnsafeMutableRawPointer(attachmentPtr).assumingMemoryBound(to: spine_mesh_attachment_wrapper.self))
                case "BoundingBoxAttachment":
                    attachment = BoundingBoxAttachment(
                        fromPointer: UnsafeMutableRawPointer(attachmentPtr).assumingMemoryBound(to: spine_bounding_box_attachment_wrapper.self))
                case "ClippingAttachment":
                    attachment = ClippingAttachment(
                        fromPointer: UnsafeMutableRawPointer(attachmentPtr).assumingMemoryBound(to: spine_clipping_attachment_wrapper.self))
                case "PathAttachment":
                    attachment = PathAttachment(
                        fromPointer: UnsafeMutableRawPointer(attachmentPtr).assumingMemoryBound(to: spine_path_attachment_wrapper.self))
                case "PointAttachment":
                    attachment = PointAttachment(
                        fromPointer: UnsafeMutableRawPointer(attachmentPtr).assumingMemoryBound(to: spine_point_attachment_wrapper.self))
                default:
                    // Unknown attachment type, treat as generic Attachment
                    attachment = nil
                }
            }

            entries.append(
                SkinEntry(
                    slotIndex: slotIndex,
                    name: name,
                    attachment: attachment
                ))
        }

        return entries
    }
}
