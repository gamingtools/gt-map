# Leaflet 1.9.4 Compatibility — Checklist

Use this checklist to select the APIs and behaviors you want supported by the GT.L facade. All items are unchecked by default so you can mark what you need. A short "Currently Implemented" note is provided up front.

Legend
- [ ]: Requested/needed by you (check to select)
- (impl): Already implemented in GT.L Phase 1
- (native): Available via native GTMap/MapApi, not through GT.L yet

Currently Implemented (GT.L Phase 1)
- (impl) GT.L.map(container, options)
- (impl) map.setView([lat, lng], zoom)
- (impl) map.getCenter(), map.getZoom()
- (impl) map.on/off for move/moveend/zoom/zoomend
- (impl) GT.L.tileLayer(url, options).addTo(map)
- (impl) L.tileLayer.setUrl(url), setOpacity(opacity), setZIndex(z) [zIndex is a no-op with single-canvas renderer]
- (impl) GT.L.icon(options)
- (impl) GT.L.marker([lat, lng], { icon }).addTo(map), setLatLng/getLatLng, remove
- (impl) map.panTo(latlng)
- (impl) map.flyTo(latlng, zoom?)
- (impl) map.fitBounds(bounds, options?), map.getBounds()
- (impl) map.zoomIn(delta?), map.zoomOut(delta?)
- (impl) map.panBy(offset)
- (impl) map.invalidateSize(options?), map.getSize(), map.getPixelBounds(), map.getPixelOrigin()

Implementation notes (Phase 1)
- panTo/flyTo/zoomIn/zoomOut/panBy: immediate (no animation yet); `zoomSnap` not applied (fractional zoom supported).
- fitBounds: immediate; respects `padding`/`paddingTopLeft`/`paddingBottomRight` and optional `maxZoom`.
- getBounds: computed from current center/zoom in Web Mercator; returns `[[south, west],[north, east]]`.
- invalidateSize: resizes the canvas immediately; `debounceMoveend`/`noMoveStart` not wired.
- TileLayer.setOpacity: sets global raster opacity for the tile draw; affects the single raster pass.
- TileLayer.setZIndex: no-op until pane/stacking is introduced.
- TileLayer.setUrl: clears cache and reloads tiles immediately; `noRedraw` parameter is accepted but ignored.

## Map (Core)
- [1] L.map(container, options)
- [1] map.setView(latlng, zoom?, options?)
- [1] map.getCenter(), map.getZoom()
- [1] map.panTo(latlng, options?)
- [1] map.flyTo(latlng, zoom?, options?)
- [1] map.fitBounds(bounds, options?)
- [1] map.getBounds()
- [1] map.addLayer(layer), map.removeLayer(layer)
- [1] map.hasLayer(layer)
- [1] map.eachLayer(fn)
- [1] map.invalidateSize(options?)
- [1] map.getSize(), map.getPixelBounds(), map.getPixelOrigin()
- [1] map.getMinZoom(), map.getMaxZoom(), map.setMinZoom(z), map.setMaxZoom(z)
- [ ] map.whenReady(fn)
- [1] map.remove()

## Map Options
- [1] center, zoom, minZoom, maxZoom
- [1] dragging (enable/disable)
- [1] inertia, inertiaDeceleration, inertiaMaxSpeed, easeLinearity
- [1] scrollWheelZoom
- [1] doubleClickZoom
- [ ] boxZoom
- [ ] keyboard
- [ ] zoomControl, attributionControl
- [ ] worldCopyJump
- [1] maxBounds, maxBoundsViscosity
- [1] zoomAnimation, zoomAnimationThreshold
- [1] fadeAnimation, markerZoomAnimation

## Map Handlers
- [ ] Dragging (Map.Drag) — screen-locked drag + inertia
- [ ] ScrollWheelZoom (Map.ScrollWheelZoom)
- [ ] DoubleClickZoom (Map.DoubleClickZoom)
- [ ] BoxZoom (Map.BoxZoom)
- [ ] Keyboard (Map.Keyboard)
- [ ] PinchZoom/TouchZoom (Map.PinchZoom)
- [ ] TapHold (Map.TapHold)

## Events (Map)
- [ ] move, moveend
- [ ] zoom, zoomend
- [ ] click, dblclick, contextmenu
- [ ] mousedown, mouseup, mousemove, mouseover, mouseout
- [ ] keydown, keyup
- [ ] dragstart, drag, dragend
- [ ] layeradd, layerremove

## Tile Layers
- [1] L.tileLayer(urlTemplate, options).addTo(map)
- [1] setUrl(url), setZIndex(z), setOpacity(opacity)
- [1] options: tileSize, minZoom, maxZoom, subdomains, errorTileUrl, tms, opacity, updateWhenIdle
- [ ] WMS: L.tileLayer.wms(url, options)

## Overlays
- [ ] L.imageOverlay(url, bounds, options).addTo(map)
- [ ] L.videoOverlay(urls, bounds, options).addTo(map)
- [ ] L.svgOverlay(svgElement, bounds, options).addTo(map)

## Marker & Icon
- [1] L.icon({ iconUrl, iconRetinaUrl, iconSize, iconAnchor, className })
- [1] L.marker(latlng, { icon, title, alt, zIndexOffset, draggable })
- [1] marker.addTo(map), marker.remove()
- [1] marker.setLatLng(latlng), marker.getLatLng()
- [1] marker.setIcon(icon), marker.setZIndexOffset()
- [ ] marker.bindPopup/popup events (see Popups)
- [ ] marker.bindTooltip/tooltip events (see Tooltips)
- [ ] marker dragging (interactive reposition)

## Layer Groups
- [1] L.layerGroup(layers)
- [1] L.featureGroup(layers)
- [1] group.addLayer/removeLayer/clearLayers()
- [1] group.eachLayer()
- [ ] featureGroup event propagation, getBounds()

## Popups
- [ ] L.popup(options)
- [ ] map.openPopup/closePopup
- [ ] layer.bindPopup(content, options), openPopup/closePopup
- [ ] popup events: add/remove/open/close

## Tooltips
- [ ] L.tooltip(options)
- [ ] layer.bindTooltip(content, options), openTooltip/closeTooltip
- [ ] tooltip events: add/remove/open/close

## Vector Layers (Paths)
- [1] L.polyline(latlngs, options)
- [1] L.polygon(latlngs, options)
- [1] L.circle(latlng, options)
- [1] L.circleMarker(latlng, options)
- [1] L.rectangle(bounds, options)
- [1] Path options: color, weight, opacity, fill, fillColor, fillOpacity, lineCap, lineJoin, dashArray, className
- [1] Path methods: addTo/remove, setStyle, bringToFront/Back, getBounds
- [ ] Renderer selection: L.canvas(), L.svg()

## GeoJSON
- [ ] L.geoJSON(data, options)
- [ ] options: pointToLayer, style, onEachFeature, filter

## Controls
- [ ] L.control.zoom(options).addTo(map)
- [ ] L.control.attribution(options).addTo(map)
- [ ] L.control.scale(options).addTo(map)
- [ ] L.control.layers(baseLayers, overlays, options)
- [ ] control.addTo(map), control.remove()

## CRS / Projection
Fixed pixel based CRS
- [ ] Custom CRS (L.CRS.*)
- [ ] Project/unproject helpers

## Panes & z-index
- [ ] map.createPane(name), getPane(name)
- [ ] pane ordering/z-index controls

## DOM Utilities (Optional)
- [ ] DomEvent on/off helpers
- [ ] setView animations via PosAnimation

## Performance & Extras (GT-native)
- [1] (native) tiles: setOptions({ maxTiles, maxInflightLoads, interactionIdleMs })
- [1] (native) tiles: setPrefetch({ enabled, baselineLevel })
- [1] (native) screen cache: setScreenCache(true/false)
- [1] (native) inertia tuning: setInertiaOptions
- [1] (native) zoom-out center bias: setZoomOutCenterBias

---

Notes
- Check the items you need; we can prioritize implementation accordingly.
- Items marked (native) exist today via the native facades and can be plumbed into GT.L where it makes sense.
- DOM-based features (popups/tooltips/controls) will be lightweight overlays anchored to world position and updated on move/zoom.
 - zIndex for TileLayer is a no-op for now because the renderer is single-canvas; proper pane/stacking controls are planned.
