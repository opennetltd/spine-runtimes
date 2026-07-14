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
import 'spine_dart_bindings_generated.dart';
import '../spine_bindings.dart';
import 'event.dart';
import 'event_type.dart';
import 'track_entry.dart';

/// EventQueueEntry wrapper
class EventQueueEntry {
  final Pointer<spine_event_queue_entry_wrapper> _ptr;

  EventQueueEntry.fromPointer(this._ptr);

  /// Get the native pointer for FFI calls
  Pointer get nativePtr => _ptr;

  factory EventQueueEntry(EventType eventType, TrackEntry? trackEntry, Event? event) {
    final ptr = SpineBindings.bindings.spine_event_queue_entry_create(eventType.value,
        trackEntry?.nativePtr.cast() ?? Pointer.fromAddress(0), event?.nativePtr.cast() ?? Pointer.fromAddress(0));
    return EventQueueEntry.fromPointer(ptr);
  }

  void dispose() {
    SpineBindings.bindings.spine_event_queue_entry_dispose(_ptr);
  }

  EventType get type {
    final result = SpineBindings.bindings.spine_event_queue_entry_get__type(_ptr);
    return EventType.fromValue(result);
  }

  set type(EventType value) {
    SpineBindings.bindings.spine_event_queue_entry_set__type(_ptr, value.value);
  }

  TrackEntry? get entry {
    final result = SpineBindings.bindings.spine_event_queue_entry_get__entry(_ptr);
    return result.address == 0 ? null : TrackEntry.fromPointer(result);
  }

  set entry(TrackEntry? value) {
    SpineBindings.bindings.spine_event_queue_entry_set__entry(_ptr, value?.nativePtr.cast() ?? Pointer.fromAddress(0));
  }

  Event? get event {
    final result = SpineBindings.bindings.spine_event_queue_entry_get__event(_ptr);
    return result.address == 0 ? null : Event.fromPointer(result);
  }

  set event(Event? value) {
    SpineBindings.bindings.spine_event_queue_entry_set__event(_ptr, value?.nativePtr.cast() ?? Pointer.fromAddress(0));
  }
}
