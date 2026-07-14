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

/// Event listener callback for animation state events
public typealias AnimationStateListener = (EventType, TrackEntry, Event?) -> Void

/// Manager for animation state event listeners
public class AnimationStateEventManager {
    // Use pointer addresses as keys since Swift wrapper objects might be recreated
    private var stateListeners: [Int: AnimationStateListener?] = [:]
    private var trackEntryListeners: [Int: [Int: AnimationStateListener]] = [:]

    public static let instance = AnimationStateEventManager()
    private init() {}

    func setStateListener(_ state: AnimationState, _ listener: AnimationStateListener?) {
        let key = Int(bitPattern: state._ptr)
        if listener == nil {
            stateListeners.removeValue(forKey: key)
        } else {
            stateListeners[key] = listener
        }
    }

    func getStateListener(_ state: AnimationState) -> AnimationStateListener? {
        let key = Int(bitPattern: state._ptr)
        return stateListeners[key] ?? nil
    }

    func setTrackEntryListener(_ entry: TrackEntry, _ listener: AnimationStateListener?) {
        // Get the animation state from the track entry itself
        guard let state = entry.animationState else {
            fatalError("TrackEntry does not have an associated AnimationState")
        }

        let stateKey = Int(bitPattern: state._ptr)
        let entryKey = Int(bitPattern: entry._ptr)

        if trackEntryListeners[stateKey] == nil {
            trackEntryListeners[stateKey] = [:]
        }

        if listener == nil {
            trackEntryListeners[stateKey]?.removeValue(forKey: entryKey)
        } else {
            trackEntryListeners[stateKey]?[entryKey] = listener
        }
    }

    func getTrackEntryListener(_ state: AnimationState, _ entry: TrackEntry) -> AnimationStateListener? {
        let stateKey = Int(bitPattern: state._ptr)
        let entryKey = Int(bitPattern: entry._ptr)
        return trackEntryListeners[stateKey]?[entryKey]
    }

    func removeTrackEntry(_ state: AnimationState, _ entry: TrackEntry) {
        let stateKey = Int(bitPattern: state._ptr)
        let entryKey = Int(bitPattern: entry._ptr)
        trackEntryListeners[stateKey]?.removeValue(forKey: entryKey)
    }

    func clearState(_ state: AnimationState) {
        let key = Int(bitPattern: state._ptr)
        stateListeners.removeValue(forKey: key)
        trackEntryListeners.removeValue(forKey: key)
    }

    /// Debug method to inspect current state of the manager
    public func debugPrint() {
        print("\nAnimationStateEventManager contents:")
        print("  State listeners: \(stateListeners.keys) (\(stateListeners.count) total)")
        print("  Track entry listeners by state:")
        for (stateKey, entries) in trackEntryListeners {
            print("    State \(stateKey): \(entries.keys) (\(entries.count) entries)")
        }
    }
}

// MARK: - AnimationState Extensions

extension AnimationState {
    /// Set a listener for all animation state events
    public func setListener(_ listener: AnimationStateListener?) {
        AnimationStateEventManager.instance.setStateListener(self, listener)
    }

    /// Get the current state listener
    public var listener: AnimationStateListener? {
        return AnimationStateEventManager.instance.getStateListener(self)
    }
}

// MARK: - TrackEntry Extensions

extension TrackEntry {
    /// Set a listener for events from this track entry
    public func setListener(_ listener: AnimationStateListener?) {
        AnimationStateEventManager.instance.setTrackEntryListener(self, listener)
    }
}
