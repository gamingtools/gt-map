**@gaming.tools/gtmap**

***

# API Overview

Quick links to common tasks using the GTMap API.

- Create a map: see [GTMap](./Class.GTMap.md)
- Configure imagery: set [image](./Interface.MapOptions.md#image) (url/width/height) and optional wrap/bounds options
- Wrap & bounds: [setWrapX](./Class.GTMap.md#setwrapx), [setMaxBoundsPx](./Class.GTMap.md#setmaxboundspx), [setMaxBoundsViscosity](./Class.GTMap.md#setmaxboundsviscosity)
- Change the view: [ViewTransition](./Interface.ViewTransition.md), [transition()](./Class.GTMap.md#transition)
- Add content: [addIcon](./Class.GTMap.md#addicon), [addMarker](./Class.GTMap.md#addmarker), [addVector](./Class.GTMap.md#addvector)
- Events: [MapEvents](./Interface.MapEvents.md), [EntityCollection.events](./Class.EntityCollection.md#events), [Marker.events](./Class.Marker.md#events)
- Utilities: [setAutoResize](./Class.GTMap.md#setautoresize), [invalidateSize](./Class.GTMap.md#invalidatesize), [setFpsCap](./Class.GTMap.md#setfpscap), [setBackgroundColor](./Class.GTMap.md#setbackgroundcolor)

Tip: The events pages list supported event names and payloads for IntelliSense.

## Contents

Use the lists below to jump directly to types and members.

### Classes

- [CircleVisual](./Class.CircleVisual.md)
- [ClusteredLayer](./Class.ClusteredLayer.md)
- [CoordTransformer](./Class.CoordTransformer.md)
- [DisplayFacade](./Class.DisplayFacade.md)
- [EntityCollection](./Class.EntityCollection.md)
- [GTMap](./Class.GTMap.md)
- [HtmlVisual](./Class.HtmlVisual.md)
- [ImageVisual](./Class.ImageVisual.md)
- [InputFacade](./Class.InputFacade.md)
- [InteractiveLayer](./Class.InteractiveLayer.md)
- [LayersFacade](./Class.LayersFacade.md)
- [Marker](./Class.Marker.md)
- [RectVisual](./Class.RectVisual.md)
- [SpriteVisual](./Class.SpriteVisual.md)
- [StaticLayer](./Class.StaticLayer.md)
- [SvgVisual](./Class.SvgVisual.md)
- [TextVisual](./Class.TextVisual.md)
- [TileLayer](./Class.TileLayer.md)
- [Vector](./Class.Vector.md)
- [ViewFacade](./Class.ViewFacade.md)
- [Visual](./Class.Visual.md)

### Interfaces

- [AddLayerOptions](./Interface.AddLayerOptions.md)
- [AnchorPoint](./Interface.AnchorPoint.md)
- [AnimateOptions](./Interface.AnimateOptions.md)
- [ApplyOptions](./Interface.ApplyOptions.md)
- [ApplyResult](./Interface.ApplyResult.md)
- [ClusterBoundaryOptions](./Interface.ClusterBoundaryOptions.md)
- [ClusteredLayerOptions](./Interface.ClusteredLayerOptions.md)
- [ClusterEventData](./Interface.ClusterEventData.md)
- [ClusterSnapshot](./Interface.ClusterSnapshot.md)
- [EntityCollectionEventMap](./Interface.EntityCollectionEventMap.md)
- [EntityCollectionEvents](./Interface.EntityCollectionEvents.md)
- [EventMap](./Interface.EventMap.md)
- [EventSubscription](./Interface.EventSubscription.md)
- [FrameEventData](./Interface.FrameEventData.md)
- [IconDef](./Interface.IconDef.md)
- [IconHandle](./Interface.IconHandle.md)
- [InertiaOptions](./Interface.InertiaOptions.md)
- [LoadEventData](./Interface.LoadEventData.md)
- [MapEvents](./Interface.MapEvents.md)
- [MapOptions](./Interface.MapOptions.md)
- [MarkerData](./Interface.MarkerData.md)
- [MarkerEventData](./Interface.MarkerEventData.md)
- [MarkerEventMap](./Interface.MarkerEventMap.md)
- [MarkerEvents](./Interface.MarkerEvents.md)
- [MarkerHit](./Interface.MarkerHit.md)
- [MarkerOptions](./Interface.MarkerOptions.md)
- [MarkerTransition](./Interface.MarkerTransition.md)
- [MaxBoundsPx](./Interface.MaxBoundsPx.md)
- [MouseEventData](./Interface.MouseEventData.md)
- [MoveEventData](./Interface.MoveEventData.md)
- [PointerEventData](./Interface.PointerEventData.md)
- [PointerMeta](./Interface.PointerMeta.md)
- [PointerModifiers](./Interface.PointerModifiers.md)
- [PublicEvents](./Interface.PublicEvents.md)
- [RenderStats](./Interface.RenderStats.md)
- [ResizeEventData](./Interface.ResizeEventData.md)
- [SetViewOptions](./Interface.SetViewOptions.md)
- [SpinnerOptions](./Interface.SpinnerOptions.md)
- [SpriteAtlasDescriptor](./Interface.SpriteAtlasDescriptor.md)
- [SpriteAtlasEntry](./Interface.SpriteAtlasEntry.md)
- [SpriteAtlasHandle](./Interface.SpriteAtlasHandle.md)
- [SpriteAtlasMeta](./Interface.SpriteAtlasMeta.md)
- [SuspendOptions](./Interface.SuspendOptions.md)
- [SvgShadow](./Interface.SvgShadow.md)
- [TileLayerOptions](./Interface.TileLayerOptions.md)
- [TileSourceOptions](./Interface.TileSourceOptions.md)
- [VectorData](./Interface.VectorData.md)
- [VectorEventMap](./Interface.VectorEventMap.md)
- [VectorEvents](./Interface.VectorEvents.md)
- [VectorOptions](./Interface.VectorOptions.md)
- [VectorStyle](./Interface.VectorStyle.md)
- [ViewState](./Interface.ViewState.md)
- [ZoomEventData](./Interface.ZoomEventData.md)

### Type Aliases

- [Anchor](./TypeAlias.Anchor.md)
- [AnchorPreset](./TypeAlias.AnchorPreset.md)
- [ApplyStatus](./TypeAlias.ApplyStatus.md)
- [Circle](./TypeAlias.Circle.md)
- [ClusterIconSizeFunction](./TypeAlias.ClusterIconSizeFunction.md)
- [Easing](./TypeAlias.Easing.md)
- [IconScaleFunction](./TypeAlias.IconScaleFunction.md)
- [InputDevice](./TypeAlias.InputDevice.md)
- [PaddingInput](./TypeAlias.PaddingInput.md)
- [Point](./TypeAlias.Point.md)
- [Polygon](./TypeAlias.Polygon.md)
- [Polyline](./TypeAlias.Polyline.md)
- [SourceBounds](./TypeAlias.SourceBounds.md)
- [TransformType](./TypeAlias.TransformType.md)
- [Unsubscribe](./TypeAlias.Unsubscribe.md)
- [UpscaleFilterMode](./TypeAlias.UpscaleFilterMode.md)
- [VectorGeometry](./TypeAlias.VectorGeometry.md)
- [VisualSize](./TypeAlias.VisualSize.md)
- [VisualType](./TypeAlias.VisualType.md)

### Functions

- [isCircle](./Function.isCircle.md)
- [isCircleVisual](./Function.isCircleVisual.md)
- [isHtmlVisual](./Function.isHtmlVisual.md)
- [isImageVisual](./Function.isImageVisual.md)
- [isPolygon](./Function.isPolygon.md)
- [isPolyline](./Function.isPolyline.md)
- [isRectVisual](./Function.isRectVisual.md)
- [isSpriteVisual](./Function.isSpriteVisual.md)
- [isSvgVisual](./Function.isSvgVisual.md)
- [isTextVisual](./Function.isTextVisual.md)

### Namespaces

- [easings](./Namespace.easings.md)

### Extras

- [Function.easeInCubic](./easings.Function.easeInCubic.md)
- [Function.easeInOutCubic](./easings.Function.easeInOutCubic.md)
- [Function.easeInOutQuad](./easings.Function.easeInOutQuad.md)
- [Function.easeInQuad](./easings.Function.easeInQuad.md)
- [Function.easeOutCubic](./easings.Function.easeOutCubic.md)
- [Function.easeOutExpo](./easings.Function.easeOutExpo.md)
- [Function.easeOutQuad](./easings.Function.easeOutQuad.md)
- [Function.linear](./easings.Function.linear.md)
- [ClusterIconSizeTemplates](./Variable.ClusterIconSizeTemplates.md)
