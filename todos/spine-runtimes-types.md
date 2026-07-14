# Spine Runtime Types

Generated from spine-libgdx (reference implementation)
Total types: 137

## Type Hierarchy


**Attachment**
- PointAttachment
- RegionAttachment
- SkeletonAttachment
- VertexAttachment
  - BoundingBoxAttachment
  - ClippingAttachment
  - MeshAttachment
  - PathAttachment

**AttachmentLoader**
- AtlasAttachmentLoader

**BoneLocal**
- BonePose

**Constraint**
- IkConstraint
- PathConstraint
- PhysicsConstraint
- Slider
- TransformConstraint

**ConstraintData**
- IkConstraintData
- PathConstraintData
- PhysicsConstraintData
- SliderData
- TransformConstraintData

**HasTextureRegion**
- MeshAttachment
- RegionAttachment

**Pose**
- BoneLocal
  - BonePose
- IkConstraintPose
- PathConstraintPose
- PhysicsConstraintPose
- SliderPose
- SlotPose
- TransformConstraintPose

**Posed**
- PosedActive
  - Bone
  - Constraint
    - IkConstraint
    - PathConstraint
    - PhysicsConstraint
    - Slider
    - TransformConstraint
- Slot

**PosedActive**
- Bone
- Constraint
  - IkConstraint
  - PathConstraint
  - PhysicsConstraint
  - Slider
  - TransformConstraint

**PosedData**
- BoneData
- ConstraintData
  - IkConstraintData
  - PathConstraintData
  - PhysicsConstraintData
  - SliderData
  - TransformConstraintData
- SlotData

**SkeletonLoader**
- SkeletonBinary
- SkeletonJson

**Update**
- BonePose
- Constraint
  - IkConstraint
  - PathConstraint
  - PhysicsConstraint
  - Slider
  - TransformConstraint

**VertexAttachment**
- BoundingBoxAttachment
- ClippingAttachment
- MeshAttachment
- PathAttachment

## All Types

- **Animation** (class) - Stores a list of timelines to animate a skeleton's pose over time.
- **Animation.AlphaTimeline** (class) extends Animation$SlotTimeline, Animation$CurveTimeline1 - Changes the alpha for a slot's {@link SlotPose#getColor()}.
- **Animation.AttachmentTimeline** (class) extends Animation$SlotTimeline, Animation$Timeline - Changes a slot's {@link SlotPose#getAttachment()}.
- **Animation.BoneTimeline** (interface) - An interface for timelines which change the property of a bone.
- **Animation.BoneTimeline1** (class) extends Animation$BoneTimeline, Animation$CurveTimeline1
- **Animation.BoneTimeline2** (class) extends Animation$BoneTimeline, Animation$CurveTimeline - The base class for a {@link CurveTimeline} that is a {@link BoneTimeline} and sets two properties.
- **Animation.ConstraintTimeline** (interface)
- **Animation.ConstraintTimeline1** (class) extends Animation$ConstraintTimeline, Animation$CurveTimeline1
- **Animation.CurveTimeline** (class) extends Animation$Timeline - The base class for timelines that interpolate between frame values using stepped, linear, or a Bezier curve.
- **Animation.CurveTimeline1** (class) extends Animation$CurveTimeline - The base class for a {@link CurveTimeline} that sets one property.
- **Animation.DeformTimeline** (class) extends Animation$SlotCurveTimeline - Changes a slot's {@link SlotPose#getDeform()} to deform a {@link VertexAttachment}.
- **Animation.DrawOrderTimeline** (class) extends Animation$Timeline - Changes a skeleton's {@link Skeleton#getDrawOrder()}.
- **Animation.EventTimeline** (class) extends Animation$Timeline - Fires an {@link Event} when specific animation times are reached.
- **Animation.IkConstraintTimeline** (class) extends Animation$ConstraintTimeline, Animation$CurveTimeline - Changes an IK constraint's {@link IkConstraintPose#getMix()}, {@link IkConstraintPose#getSoftness()},
- **Animation.InheritTimeline** (class) extends Animation$BoneTimeline, Animation$Timeline - Changes a bone's {@link BoneLocal#getInherit()}.
- **Animation.MixBlend** (enum) - Controls how timeline values are mixed with setup pose values or current pose values when a timeline is applied with
- **Animation.MixDirection** (enum) - Indicates whether a timeline's <code>alpha</code> is mixing out over time toward 0 (the setup or current pose value) or
- **Animation.PathConstraintMixTimeline** (class) extends Animation$ConstraintTimeline, Animation$CurveTimeline - Changes a path constraint's {@link PathConstraintPose#getMixRotate()}, {@link PathConstraintPose#getMixX()}, and
- **Animation.PathConstraintPositionTimeline** (class) extends Animation$ConstraintTimeline1 - Changes a path constraint's {@link PathConstraintPose#getPosition()}.
- **Animation.PathConstraintSpacingTimeline** (class) extends Animation$ConstraintTimeline1 - Changes a path constraint's {@link PathConstraintPose#getSpacing()}.
- **Animation.PhysicsConstraintDampingTimeline** (class) extends Animation$PhysicsConstraintTimeline - Changes a physics constraint's {@link PhysicsConstraintPose#getDamping()}.
- **Animation.PhysicsConstraintGravityTimeline** (class) extends Animation$PhysicsConstraintTimeline - Changes a physics constraint's {@link PhysicsConstraintPose#getGravity()}.
- **Animation.PhysicsConstraintInertiaTimeline** (class) extends Animation$PhysicsConstraintTimeline - Changes a physics constraint's {@link PhysicsConstraintPose#getInertia()}.
- **Animation.PhysicsConstraintMassTimeline** (class) extends Animation$PhysicsConstraintTimeline - Changes a physics constraint's {@link PhysicsConstraintPose#getMassInverse()}. The timeline values are not inverted.
- **Animation.PhysicsConstraintMixTimeline** (class) extends Animation$PhysicsConstraintTimeline - Changes a physics constraint's {@link PhysicsConstraintPose#getMix()}.
- **Animation.PhysicsConstraintResetTimeline** (class) extends Animation$ConstraintTimeline, Animation$Timeline - Resets a physics constraint when specific animation times are reached.
- **Animation.PhysicsConstraintStrengthTimeline** (class) extends Animation$PhysicsConstraintTimeline - Changes a physics constraint's {@link PhysicsConstraintPose#getStrength()}.
- **Animation.PhysicsConstraintTimeline** (class) extends Animation$ConstraintTimeline1 - The base class for most {@link PhysicsConstraint} timelines.
- **Animation.PhysicsConstraintWindTimeline** (class) extends Animation$PhysicsConstraintTimeline - Changes a physics constraint's {@link PhysicsConstraintPose#getWind()}.
- **Animation.Property** (enum)
- **Animation.RGB2Timeline** (class) extends Animation$SlotCurveTimeline - Changes the RGB for a slot's {@link SlotPose#getColor()} and {@link SlotPose#getDarkColor()} for two color tinting.
- **Animation.RGBA2Timeline** (class) extends Animation$SlotCurveTimeline - Changes a slot's {@link SlotPose#getColor()} and {@link SlotPose#getDarkColor()} for two color tinting.
- **Animation.RGBATimeline** (class) extends Animation$SlotCurveTimeline - Changes a slot's {@link SlotPose#getColor()}.
- **Animation.RGBTimeline** (class) extends Animation$SlotCurveTimeline - Changes the RGB for a slot's {@link SlotPose#getColor()}.
- **Animation.RotateTimeline** (class) extends Animation$BoneTimeline1 - Changes a bone's local {@link BoneLocal#getRotation()}.
- **Animation.ScaleTimeline** (class) extends Animation$BoneTimeline2 - Changes a bone's local {@link BoneLocal#getScaleX()} and {@link BoneLocal#getScaleY()}.
- **Animation.ScaleXTimeline** (class) extends Animation$BoneTimeline1 - Changes a bone's local {@link BoneLocal#getScaleX()}.
- **Animation.ScaleYTimeline** (class) extends Animation$BoneTimeline1 - Changes a bone's local {@link BoneLocal#getScaleY()}.
- **Animation.SequenceTimeline** (class) extends Animation$SlotTimeline, Animation$Timeline - Changes a slot's {@link SlotPose#getSequenceIndex()} for an attachment's {@link Sequence}.
- **Animation.ShearTimeline** (class) extends Animation$BoneTimeline2 - Changes a bone's local {@link BoneLocal#getShearX()} and {@link BoneLocal#getShearY()}.
- **Animation.ShearXTimeline** (class) extends Animation$BoneTimeline1 - Changes a bone's local {@link BoneLocal#getShearX()}.
- **Animation.ShearYTimeline** (class) extends Animation$BoneTimeline1 - Changes a bone's local {@link BoneLocal#getShearY()}.
- **Animation.SliderMixTimeline** (class) extends Animation$ConstraintTimeline1 - Changes a slider's {@link SliderPose#getMix()}.
- **Animation.SliderTimeline** (class) extends Animation$ConstraintTimeline1 - Changes a slider's {@link SliderPose#getTime()}.
- **Animation.SlotCurveTimeline** (class) extends Animation$SlotTimeline, Animation$CurveTimeline
- **Animation.SlotTimeline** (interface) - An interface for timelines which change the property of a slot.
- **Animation.Timeline** (class) - The base class for all timelines.
- **Animation.TransformConstraintTimeline** (class) extends Animation$ConstraintTimeline, Animation$CurveTimeline - Changes a transform constraint's {@link TransformConstraintPose#getMixRotate()}, {@link TransformConstraintPose#getMixX()},
- **Animation.TranslateTimeline** (class) extends Animation$BoneTimeline2 - Changes a bone's local {@link BoneLocal#getX()} and {@link BoneLocal#getY()}.
- **Animation.TranslateXTimeline** (class) extends Animation$BoneTimeline1 - Changes a bone's local {@link BoneLocal#getX()}.
- **Animation.TranslateYTimeline** (class) extends Animation$BoneTimeline1 - Changes a bone's local {@link BoneLocal#getY()}.
- **AnimationState** (class) - Applies animations over time, queues animations for later playback, mixes (crossfading) between animations, and applies
- **AnimationState.AnimationStateAdapter** (class) extends AnimationState$AnimationStateListener
- **AnimationState.AnimationStateListener** (interface) - The interface to implement for receiving TrackEntry events. It is always safe to call AnimationState methods when receiving
- **AnimationState.EventQueue** (class)
- **AnimationState.EventType** (enum)
- **AnimationState.TrackEntry** (class) - Stores settings and other state for the playback of an animation on an {@link AnimationState} track.
- **AnimationStateData** (class) - Stores mix (crossfade) durations to be applied when {@link AnimationState} animations are changed.
- **AnimationStateData.Key** (class)
- **AtlasAttachmentLoader** (class) extends AttachmentLoader - An {@link AttachmentLoader} that configures attachments using texture regions from an {@link Atlas}.
- **Attachment** (class) - The base class for all attachments.
- **AttachmentLoader** (interface) - The interface which can be implemented to customize creating and populating attachments.
- **AttachmentType** (enum)
- **BlendMode** (enum) - Determines how images are blended with existing pixels when drawn.
- **Bone** (class) extends PosedActive - The current pose for a bone, before constraints are applied.
- **BoneData** (class) extends PosedData - The setup pose for a bone.
- **BoneData.Inherit** (enum) - Determines how a bone inherits world transforms from parent bones.
- **BoneLocal** (class) extends Pose - Stores a bone's local pose.
- **BonePose** (class) extends Update, BoneLocal - The applied pose for a bone. This is the {@link Bone} pose with constraints applied and the world transform computed by
- **BoundingBoxAttachment** (class) extends VertexAttachment - An attachment with vertices that make up a polygon. Can be used for hit detection, creating physics bodies, spawning particle
- **ClippingAttachment** (class) extends VertexAttachment - An attachment with vertices that make up a polygon used for clipping the rendering of other attachments.
- **Constraint** (class) extends Update, PosedActive
- **ConstraintData** (class) extends PosedData
- **Event** (class) - Stores the current pose values for an {@link Event}.
- **EventData** (class) - Stores the setup pose values for an {@link Event}.
- **HasTextureRegion** (interface)
- **IkConstraint** (class) extends Constraint - Stores the current pose for an IK constraint. An IK constraint adjusts the rotation of 1 or 2 constrained bones so the tip of
- **IkConstraintData** (class) extends ConstraintData - Stores the setup pose for an {@link IkConstraint}.
- **IkConstraintPose** (class) extends Pose - Stores the current pose for an IK constraint.
- **MeshAttachment** (class) extends HasTextureRegion, VertexAttachment - An attachment that displays a textured mesh. A mesh has hull vertices and internal vertices within the hull. Holes are not
- **PathAttachment** (class) extends VertexAttachment - An attachment whose vertices make up a composite Bezier curve.
- **PathConstraint** (class) extends Constraint - Stores the current pose for a path constraint. A path constraint adjusts the rotation, translation, and scale of the
- **PathConstraintData** (class) extends ConstraintData - Stores the setup pose for a {@link PathConstraint}.
- **PathConstraintData.PositionMode** (enum) - Controls how the first bone is positioned along the path.
- **PathConstraintData.RotateMode** (enum) - Controls how bones are rotated, translated, and scaled to match the path.
- **PathConstraintData.SpacingMode** (enum) - Controls how bones after the first bone are positioned along the path.
- **PathConstraintPose** (class) extends Pose - Stores a pose for a path constraint.
- **Physics** (enum) - Determines how physics and other non-deterministic updates are applied.
- **PhysicsConstraint** (class) extends Constraint - Stores the current pose for a physics constraint. A physics constraint applies physics to bones.
- **PhysicsConstraintData** (class) extends ConstraintData - Stores the setup pose for a {@link PhysicsConstraint}.
- **PhysicsConstraintPose** (class) extends Pose - Stores a pose for a physics constraint.
- **PointAttachment** (class) extends Attachment - An attachment which is a single point and a rotation. This can be used to spawn projectiles, particles, etc. A bone can be
- **Pose** (interface)
- **Posed** (class)
- **PosedActive** (class) extends Posed
- **PosedData** (class) - The base class for all constrained datas.
- **RegionAttachment** (class) extends HasTextureRegion, Attachment - An attachment that displays a textured quadrilateral.
- **Sequence** (class)
- **Sequence.SequenceMode** (enum)
- **Skeleton** (class) - Stores the current pose for a skeleton.
- **SkeletonAttachment** (class) extends Attachment - Attachment that displays a skeleton.
- **SkeletonBinary** (class) extends SkeletonLoader - Loads skeleton data in the Spine binary format.
- **SkeletonBinary.LinkedMesh** (class)
- **SkeletonBinary.SkeletonInput** (class)
- **SkeletonBinary.Vertices** (class)
- **SkeletonBounds** (class) - Collects each visible {@link BoundingBoxAttachment} and computes the world vertices for its polygon. The polygon vertices are
- **SkeletonData** (class) - Stores the setup pose and all of the stateless data for a skeleton.
- **SkeletonJson** (class) extends SkeletonLoader - Loads skeleton data in the Spine JSON format.
- **SkeletonJson.LinkedMesh** (class)
- **SkeletonLoader** (class) - Base class for loading skeleton data from a file.
- **Skin** (class) - Stores attachments by slot index and attachment name.
- **Skin.SkinEntry** (class) - Stores an entry in the skin consisting of the slot index and the attachment name.
- **Slider** (class) extends Constraint - Stores the setup pose for a {@link PhysicsConstraint}.
- **SliderData** (class) extends ConstraintData - Stores the setup pose for a {@link Slider}.
- **SliderPose** (class) extends Pose - Stores a pose for a slider.
- **Slot** (class) extends Posed - Stores a slot's current pose. Slots organize attachments for {@link Skeleton#drawOrder} purposes and provide a place to store
- **SlotData** (class) extends PosedData - Stores the setup pose for a {@link Slot}.
- **SlotPose** (class) extends Pose - Stores a slot's pose. Slots organize attachments for {@link Skeleton#drawOrder} purposes and provide a place to store state
- **TransformConstraint** (class) extends Constraint - Stores the current pose for a transform constraint. A transform constraint adjusts the world transform of the constrained
- **TransformConstraintData** (class) extends ConstraintData - Stores the setup pose for a {@link TransformConstraint}.
- **TransformConstraintData.FromProperty** (class) - Source property for a {@link TransformConstraint}.
- **TransformConstraintData.FromRotate** (class) extends TransformConstraintData$FromProperty
- **TransformConstraintData.FromScaleX** (class) extends TransformConstraintData$FromProperty
- **TransformConstraintData.FromScaleY** (class) extends TransformConstraintData$FromProperty
- **TransformConstraintData.FromShearY** (class) extends TransformConstraintData$FromProperty
- **TransformConstraintData.FromX** (class) extends TransformConstraintData$FromProperty
- **TransformConstraintData.FromY** (class) extends TransformConstraintData$FromProperty
- **TransformConstraintData.ToProperty** (class) - Constrained property for a {@link TransformConstraint}.
- **TransformConstraintData.ToRotate** (class) extends TransformConstraintData$ToProperty
- **TransformConstraintData.ToScaleX** (class) extends TransformConstraintData$ToProperty
- **TransformConstraintData.ToScaleY** (class) extends TransformConstraintData$ToProperty
- **TransformConstraintData.ToShearY** (class) extends TransformConstraintData$ToProperty
- **TransformConstraintData.ToX** (class) extends TransformConstraintData$ToProperty
- **TransformConstraintData.ToY** (class) extends TransformConstraintData$ToProperty
- **TransformConstraintPose** (class) extends Pose - Stores a pose for a transform constraint.
- **Update** (interface) - The interface for items updated by {@link Skeleton#updateWorldTransform(Physics)}.
- **VertexAttachment** (class) extends Attachment - Base class for an attachment with vertices that are transformed by one or more bones and can be deformed by a slot's
