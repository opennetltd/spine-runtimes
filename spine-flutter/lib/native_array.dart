// ******************************************************************************
// Spine Runtimes License Agreement
// Last updated July 28, 2023. Replaces all prior versions.
//
// Copyright (c) 2013-2023, Esoteric Software LLC
//
// Integration of the Spine Runtimes into software or otherwise creating
// derivative works of the Spine Runtimes is permitted under the terms and
// conditions of Section 2 of the Spine Editor License Agreement:
// http://esotericsoftware.com/spine-editor-license
//
// Otherwise, it is permitted to integrate the Spine Runtimes into software or
// otherwise create derivative works of the Spine Runtimes (collectively,
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
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THE
// SPINE RUNTIMES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
// *****************************************************************************/

import 'package:universal_ffi/ffi.dart';
import 'dart:collection';

/// Base class for native spine arrays.
///
/// Provides a Dart List-like interface over native spine arrays.
/// The native memory is managed by the spine runtime and should not
/// be freed directly from Dart.
abstract class NativeArray<T> extends ListBase<T> {
  final Pointer _nativeArray;

  NativeArray(this._nativeArray);

  /// Get the native pointer for FFI calls
  Pointer get nativePtr => _nativeArray;

  /// The number of elements in this array.
  /// Must be implemented by subclasses to call the appropriate spine_array_*_get_size
  @override
  int get length;

  /// Get the element at the given index.
  /// Must be implemented by subclasses to call the appropriate spine_array_*_get
  @override
  T operator [](int index);

  /// Set the element at the given index.
  /// For read-only arrays, this will throw an UnsupportedError.
  /// Must be implemented by subclasses that support modification.
  @override
  void operator []=(int index, T value) {
    throw UnsupportedError('This array is read-only');
  }

  /// Sets the length of the list.
  /// For read-only arrays, this will throw an UnsupportedError.
  /// Must be implemented by subclasses that support modification.
  @override
  set length(int newLength) {
    throw UnsupportedError('This array is read-only');
  }
}
