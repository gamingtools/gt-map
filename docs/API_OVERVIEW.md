# API Overview

Quick links to common tasks using the GTMap API.

- Create a map: see [GTMap](api/Class.GTMap.md)
- Configure imagery: set [image](api/Interface.MapOptions.md#image) (url/width/height) and optional wrap/bounds options
- Loading spinner: configure [spinner](api/Interface.MapOptions.md#spinner) (size/thickness/color/speed)
- Wrap & bounds: [setWrapX](api/Class.GTMap.md#setwrapx), [setMaxBoundsPx](api/Class.GTMap.md#setmaxboundspx), [setMaxBoundsViscosity](api/Class.GTMap.md#setmaxboundsviscosity)
- Change the view: [ViewTransition](api/Interface.ViewTransition.md), [transition()](api/Class.GTMap.md#transition)
- Add content: [addIcon](api/Class.GTMap.md#addicon), [addMarker](api/Class.GTMap.md#addmarker), [addVector](api/Class.GTMap.md#addvector)
- Events: [MapEvents](api/Interface.MapEvents.md), [Layer.events](api/Class.Layer.md#events), [Marker.events](api/Class.Marker.md#events)
- Utilities: [setAutoResize](api/Class.GTMap.md#setautoresize), [invalidateSize](api/Class.GTMap.md#invalidatesize), [setFpsCap](api/Class.GTMap.md#setfpscap), [setBackgroundColor](api/Class.GTMap.md#setbackgroundcolor)
 - Coordinate Transforms: [setCoordBounds](api/Class.GTMap.md#setcoordbounds), [translate](api/Class.GTMap.md#translate)

Tip: The events pages list supported event names and payloads for IntelliSense.

## Contents

Use the lists below to jump directly to types and members.

### Classes

- [GTMap](api/Class.GTMap.md)
- [Layer](api/Class.Layer.md)
- [Marker](api/Class.Marker.md)
- [VectorEntity](api/Class.VectorEntity.md)

### Interfaces

- [ActiveOptions](api/Interface.ActiveOptions.md)
- [AnimateOptions](api/Interface.AnimateOptions.md)
- [ApplyOptions](api/Interface.ApplyOptions.md)
- [ApplyResult](api/Interface.ApplyResult.md)
- [EventMap](api/Interface.EventMap.md)
- [EventSubscription](api/Interface.EventSubscription.md)
- [FrameEventData](api/Interface.FrameEventData.md)
- [IconDef](api/Interface.IconDef.md)
- [IconHandle](api/Interface.IconHandle.md)
- [ImageSourceOptions](api/Interface.ImageSourceOptions.md)
- [LayerEventMap](api/Interface.LayerEventMap.md)
- [LayerEvents](api/Interface.LayerEvents.md)
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
- [MouseEventData](api/Interface.MouseEventData.md)
- [MoveEventData](api/Interface.MoveEventData.md)
- [PointerEventData](api/Interface.PointerEventData.md)
- [PointerMeta](api/Interface.PointerMeta.md)
- [PointerModifiers](api/Interface.PointerModifiers.md)
- [PublicEvents](api/Interface.PublicEvents.md)
- [RenderStats](api/Interface.RenderStats.md)
- [ResizeEventData](api/Interface.ResizeEventData.md)
- [VectorData](api/Interface.VectorData.md)
- [VectorEventMap](api/Interface.VectorEventMap.md)
- [VectorEvents](api/Interface.VectorEvents.md)
- [VectorStyle](api/Interface.VectorStyle.md)
- [ViewState](api/Interface.ViewState.md)
- [ViewTransition](api/Interface.ViewTransition.md)
- [ZoomEventData](api/Interface.ZoomEventData.md)

### Type Aliases

- [ApplyStatus](api/TypeAlias.ApplyStatus.md)
- [Circle](api/TypeAlias.Circle.md)
- [Easing](api/TypeAlias.Easing.md)
- [IconScaleFunction](api/TypeAlias.IconScaleFunction.md)
- [InputDevice](api/TypeAlias.InputDevice.md)
- [Point](api/TypeAlias.Point.md)
- [Polygon](api/TypeAlias.Polygon.md)
- [Polyline](api/TypeAlias.Polyline.md)
- [Unsubscribe](api/TypeAlias.Unsubscribe.md)
- [Vector](api/TypeAlias.Vector.md)
- [VectorGeometry](api/TypeAlias.VectorGeometry.md)
 - [SourceBounds](api/TypeAlias.SourceBounds.md)
 - [TransformType](api/TypeAlias.TransformType.md)

### Functions

- [isCircle](api/Function.isCircle.md)
- [isPolygon](api/Function.isPolygon.md)
- [isPolyline](api/Function.isPolyline.md)

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
