# API Overview

Quick links to common tasks using the GTMap API.

- Create a map: see [GTMap](api/Class.GTMap.md)
- Configure imagery: set [image](api/Interface.MapOptions.md#image) (url/width/height) and optional wrap/bounds options
- Wrap & bounds: [setWrapX](api/Class.GTMap.md#setwrapx), [setMaxBoundsPx](api/Class.GTMap.md#setmaxboundspx), [setMaxBoundsViscosity](api/Class.GTMap.md#setmaxboundsviscosity)
- Change the view: [ViewTransition](api/Interface.ViewTransition.md), [transition()](api/Class.GTMap.md#transition)
- Add content: [addIcon](api/Class.GTMap.md#addicon), [addMarker](api/Class.GTMap.md#addmarker), [addVector](api/Class.GTMap.md#addvector)
- Events: [MapEvents](api/Interface.MapEvents.md), [EntityCollection.events](api/Class.EntityCollection.md#events), [Marker.events](api/Class.Marker.md#events)
- Utilities: [setAutoResize](api/Class.GTMap.md#setautoresize), [invalidateSize](api/Class.GTMap.md#invalidatesize), [setFpsCap](api/Class.GTMap.md#setfpscap), [setBackgroundColor](api/Class.GTMap.md#setbackgroundcolor)

Tip: The events pages list supported event names and payloads for IntelliSense.

## Contents

Use the lists below to jump directly to types and members.

### Classes

- [CircleVisual](api/Class.CircleVisual.md)
- [CoordTransformer](api/Class.CoordTransformer.md)
- [Decal](api/Class.Decal.md)
- [EntityCollection](api/Class.EntityCollection.md)
- [GTMap](api/Class.GTMap.md)
- [HtmlVisual](api/Class.HtmlVisual.md)
- [ImageVisual](api/Class.ImageVisual.md)
- [Marker](api/Class.Marker.md)
- [RectVisual](api/Class.RectVisual.md)
- [SvgVisual](api/Class.SvgVisual.md)
- [TextVisual](api/Class.TextVisual.md)
- [Vector](api/Class.Vector.md)
- [Visual](api/Class.Visual.md)

### Interfaces

- [AnchorPoint](api/Interface.AnchorPoint.md)
- [AnimateOptions](api/Interface.AnimateOptions.md)
- [ApplyOptions](api/Interface.ApplyOptions.md)
- [ApplyResult](api/Interface.ApplyResult.md)
- [DecalData](api/Interface.DecalData.md)
- [DecalEventMap](api/Interface.DecalEventMap.md)
- [DecalEvents](api/Interface.DecalEvents.md)
- [DecalOptions](api/Interface.DecalOptions.md)
- [EntityCollectionEventMap](api/Interface.EntityCollectionEventMap.md)
- [EntityCollectionEvents](api/Interface.EntityCollectionEvents.md)
- [EventMap](api/Interface.EventMap.md)
- [EventSubscription](api/Interface.EventSubscription.md)
- [FrameEventData](api/Interface.FrameEventData.md)
- [IconDef](api/Interface.IconDef.md)
- [IconHandle](api/Interface.IconHandle.md)
- [ImageSourceOptions](api/Interface.ImageSourceOptions.md)
- [LoadEventData](api/Interface.LoadEventData.md)
- [MapEvents](api/Interface.MapEvents.md)
- [MapOptions](api/Interface.MapOptions.md)
- [MarkerData](api/Interface.MarkerData.md)
- [MarkerEventData](api/Interface.MarkerEventData.md)
- [MarkerEventMap](api/Interface.MarkerEventMap.md)
- [MarkerEvents](api/Interface.MarkerEvents.md)
- [MarkerHit](api/Interface.MarkerHit.md)
- [MarkerOptions](api/Interface.MarkerOptions.md)
- [MarkerTransition](api/Interface.MarkerTransition.md)
- [MaxBoundsPx](api/Interface.MaxBoundsPx.md)
- [MouseEventData](api/Interface.MouseEventData.md)
- [MoveEventData](api/Interface.MoveEventData.md)
- [PointerEventData](api/Interface.PointerEventData.md)
- [PointerMeta](api/Interface.PointerMeta.md)
- [PointerModifiers](api/Interface.PointerModifiers.md)
- [PublicEvents](api/Interface.PublicEvents.md)
- [RenderStats](api/Interface.RenderStats.md)
- [ResizeEventData](api/Interface.ResizeEventData.md)
- [SpinnerOptions](api/Interface.SpinnerOptions.md)
- [SuspendOptions](api/Interface.SuspendOptions.md)
- [VectorData](api/Interface.VectorData.md)
- [VectorEventMap](api/Interface.VectorEventMap.md)
- [VectorEvents](api/Interface.VectorEvents.md)
- [VectorOptions](api/Interface.VectorOptions.md)
- [VectorStyle](api/Interface.VectorStyle.md)
- [ViewState](api/Interface.ViewState.md)
- [ViewTransition](api/Interface.ViewTransition.md)
- [ZoomEventData](api/Interface.ZoomEventData.md)

### Type Aliases

- [Anchor](api/TypeAlias.Anchor.md)
- [AnchorPreset](api/TypeAlias.AnchorPreset.md)
- [ApplyStatus](api/TypeAlias.ApplyStatus.md)
- [Circle](api/TypeAlias.Circle.md)
- [Easing](api/TypeAlias.Easing.md)
- [IconScaleFunction](api/TypeAlias.IconScaleFunction.md)
- [InputDevice](api/TypeAlias.InputDevice.md)
- [Point](api/TypeAlias.Point.md)
- [Polygon](api/TypeAlias.Polygon.md)
- [Polyline](api/TypeAlias.Polyline.md)
- [SourceBounds](api/TypeAlias.SourceBounds.md)
- [TransformType](api/TypeAlias.TransformType.md)
- [Unsubscribe](api/TypeAlias.Unsubscribe.md)
- [VectorGeometry](api/TypeAlias.VectorGeometry.md)
- [VisualSize](api/TypeAlias.VisualSize.md)
- [VisualType](api/TypeAlias.VisualType.md)

### Functions

- [isCircle](api/Function.isCircle.md)
- [isCircleVisual](api/Function.isCircleVisual.md)
- [isHtmlVisual](api/Function.isHtmlVisual.md)
- [isImageVisual](api/Function.isImageVisual.md)
- [isPolygon](api/Function.isPolygon.md)
- [isPolyline](api/Function.isPolyline.md)
- [isRectVisual](api/Function.isRectVisual.md)
- [isSvgVisual](api/Function.isSvgVisual.md)
- [isTextVisual](api/Function.isTextVisual.md)

### Namespaces

- [easings](api/Namespace.easings.md)

### Extras

- [globals](api/globals.md)
- [Function.easeInCubic](api/easings.Function.easeInCubic.md)
- [Function.easeInOutCubic](api/easings.Function.easeInOutCubic.md)
- [Function.easeInOutQuad](api/easings.Function.easeInOutQuad.md)
- [Function.easeInQuad](api/easings.Function.easeInQuad.md)
- [Function.easeOutCubic](api/easings.Function.easeOutCubic.md)
- [Function.easeOutExpo](api/easings.Function.easeOutExpo.md)
- [Function.easeOutQuad](api/easings.Function.easeOutQuad.md)
- [Function.linear](api/easings.Function.linear.md)
