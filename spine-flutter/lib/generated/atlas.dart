//
// Spine Runtimes License Agreement
// Last updated April 5, 2025. Replaces all prior versions.
//
// Copyright (c) 2013-2025, Esoteric Software LLC
//
// Integration of the Spine Runtimes into software or otherwise creating
// derivative works of the Spine Runtimes is permitted under the terms and
// conditions of Section 2 of the Spine Editor License Agreement:
// http://esotericsoftware.com/spine-editor-license
//
// Otherwise, it is permitted to integrate the Spine Runtimes into software
// or otherwise create derivative works of the Spine Runtimes (collectively,
// "Products"), provided that each user of the Products must obtain their own
// Spine Editor license and redistribution of the Products in any form must
// include this license and copyright notice.
//
// THE SPINE RUNTIMES ARE PROVIDED BY ESOTERIC SOFTWARE LLC "AS IS" AND ANY
// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL ESOTERIC SOFTWARE LLC BE LIABLE FOR ANY
// DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES,
// BUSINESS INTERRUPTION, OR LOSS OF USE, DATA, OR PROFITS) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
// THE SPINE RUNTIMES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//

// AUTO GENERATED FILE, DO NOT EDIT.

import 'package:universal_ffi/ffi.dart';
import 'package:universal_ffi/ffi_utils.dart';
import 'spine_dart_bindings_generated.dart';
import '../spine_bindings.dart';
import 'arrays.dart';
import 'atlas_region.dart';

/// Atlas wrapper
class Atlas {
  final Pointer<spine_atlas_wrapper> _ptr;

  Atlas.fromPointer(this._ptr);

  /// Get the native pointer for FFI calls
  Pointer get nativePtr => _ptr;

  void dispose() {
    SpineBindings.bindings.spine_atlas_dispose(_ptr);
  }

  void flipV() {
    SpineBindings.bindings.spine_atlas_flip_v(_ptr);
  }

  /// Returns the first region found with the specified name. This method uses
  /// String comparison to find the region, so the result should be cached
  /// rather than calling this method multiple times.
  ///
  /// Returns The region, or nullptr.
  AtlasRegion? findRegion(String name) {
    final result = SpineBindings.bindings.spine_atlas_find_region(_ptr, name.toNativeUtf8().cast<Char>());
    return result.address == 0 ? null : AtlasRegion.fromPointer(result);
  }

  ArrayAtlasPage get pages {
    final result = SpineBindings.bindings.spine_atlas_get_pages(_ptr);
    return ArrayAtlasPage.fromPointer(result);
  }

  ArrayAtlasRegion get regions {
    final result = SpineBindings.bindings.spine_atlas_get_regions(_ptr);
    return ArrayAtlasRegion.fromPointer(result);
  }
}
