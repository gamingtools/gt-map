**@gaming.tools/gtmap**

***

# API Overview

Quick links to common tasks using the GTMap API.

- Create a map: see [GTMap](./Class.GTMap.md)
- Configure tiles: set [tileSource](./Interface.MapOptions.md#tilesource) ([url](./Interface.TileSourceOptions.md#url), [tileSize](./Interface.TileSourceOptions.md#tilesize), [mapSize](./Interface.TileSourceOptions.md#mapsize), [sourceMinZoom](./Interface.TileSourceOptions.md#sourceminzoom), [sourceMaxZoom](./Interface.TileSourceOptions.md#sourcemaxzoom))
- Wrap & bounds: [setWrapX](./Class.GTMap.md#setwrapx), [setMaxBoundsPx](./Class.GTMap.md#setmaxboundspx), [setMaxBoundsViscosity](./Class.GTMap.md#setmaxboundsviscosity)
- Change the view: [ViewTransition](./Interface.ViewTransition.md), [transition()](./Class.GTMap.md#transition)
- Add content: [addIcon](./Class.GTMap.md#addicon), [addMarker](./Class.GTMap.md#addmarker), [addVector](./Class.GTMap.md#addvector)
- Events: [MapEvents](./Interface.MapEvents.md), [Layer.events](./Class.Layer.md#events), [Marker.events](./Class.Marker.md#events)
- Utilities: [setAutoResize](./Class.GTMap.md#setautoresize), [invalidateSize](./Class.GTMap.md#invalidatesize), [setFpsCap](./Class.GTMap.md#setfpscap), [setBackgroundColor](./Class.GTMap.md#setbackgroundcolor)

Tip: The events pages list supported event names and payloads for IntelliSense.

## Contents

Use the lists below to jump directly to types and members.

### Classes

- [GTMap](./Class.GTMap.md)
- [Layer](./Class.Layer.md)
- [Marker](./Class.Marker.md)
- [VectorEntity](./Class.VectorEntity.md)

### Interfaces

- [ActiveOptions](./Interface.ActiveOptions.md)
- [AnimateOptions](./Interface.AnimateOptions.md)
- [ApplyOptions](./Interface.ApplyOptions.md)
- [ApplyResult](./Interface.ApplyResult.md)
- [EventMap](./Interface.EventMap.md)
- [EventSubscription](./Interface.EventSubscription.md)
- [FrameEventData](./Interface.FrameEventData.md)
- [IconDef](./Interface.IconDef.md)
- [IconHandle](./Interface.IconHandle.md)
- [LayerEventMap](./Interface.LayerEventMap.md)
- [LayerEvents](./Interface.LayerEvents.md)
- [LoadEventData](./Interface.LoadEventData.md)
- [MapEvents](./Interface.MapEvents.md)
- [MapOptions](./Interface.MapOptions.md)
- [MarkerData](./Interface.MarkerData.md)
- [MarkerEventData](./Interface.MarkerEventData.md)
- [MarkerEventMap](./Interface.MarkerEventMap.md)
- [MarkerEvents](./Interface.MarkerEvents.md)
- [MarkerHit](./Interface.MarkerHit.md)
- [MarkerOptions](./Interface.MarkerOptions.md)
- [MouseEventData](./Interface.MouseEventData.md)
- [MoveEventData](./Interface.MoveEventData.md)
- [PointerEventData](./Interface.PointerEventData.md)
- [PointerMeta](./Interface.PointerMeta.md)
- [PointerModifiers](./Interface.PointerModifiers.md)
- [PublicEvents](./Interface.PublicEvents.md)
- [RenderStats](./Interface.RenderStats.md)
- [ResizeEventData](./Interface.ResizeEventData.md)
- [TileSourceOptions](./Interface.TileSourceOptions.md)
- [VectorData](./Interface.VectorData.md)
- [VectorEventMap](./Interface.VectorEventMap.md)
- [VectorEvents](./Interface.VectorEvents.md)
- [VectorStyle](./Interface.VectorStyle.md)
- [ViewState](./Interface.ViewState.md)
- [ViewTransition](./Interface.ViewTransition.md)
- [ZoomEventData](./Interface.ZoomEventData.md)

### Type Aliases

- [ApplyStatus](./TypeAlias.ApplyStatus.md)
- [Circle](./TypeAlias.Circle.md)
- [Easing](./TypeAlias.Easing.md)
- [IconScaleFunction](./TypeAlias.IconScaleFunction.md)
- [InputDevice](./TypeAlias.InputDevice.md)
- [Point](./TypeAlias.Point.md)
- [Polygon](./TypeAlias.Polygon.md)
- [Polyline](./TypeAlias.Polyline.md)
- [Unsubscribe](./TypeAlias.Unsubscribe.md)
- [Vector](./TypeAlias.Vector.md)
- [VectorGeometry](./TypeAlias.VectorGeometry.md)

### Functions

- [isCircle](./Function.isCircle.md)
- [isPolygon](./Function.isPolygon.md)
- [isPolyline](./Function.isPolyline.md)

### Namespaces

- [easings](./Namespace.easings.md)

### Extras

- [globals](./globals.md)
- [Function.easeInCubic](./easings.Function.easeInCubic.md)
- [Function.easeInOutCubic](./easings.Function.easeInOutCubic.md)
- [Function.easeInOutQuad](./easings.Function.easeInOutQuad.md)
- [Function.easeInQuad](./easings.Function.easeInQuad.md)
- [Function.easeOutCubic](./easings.Function.easeOutCubic.md)
- [Function.easeOutExpo](./easings.Function.easeOutExpo.md)
- [Function.easeOutQuad](./easings.Function.easeOutQuad.md)
- [Function.linear](./easings.Function.linear.md)
