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
- (impl) GT.L.icon(options)
- (impl) GT.L.marker([lat, lng], { icon }).addTo(map), setLatLng/getLatLng, remove

## Map (Core)
- [ ] L.map(container, options)
- [ ] map.setView(latlng, zoom?, options?)
- [ ] map.getCenter(), map.getZoom()
- [ ] map.panTo(latlng, options?)
- [ ] map.flyTo(latlng, zoom?, options?)
- [ ] map.fitBounds(bounds, options?)
- [ ] map.getBounds()
- [ ] map.addLayer(layer), map.removeLayer(layer)
- [ ] map.hasLayer(layer)
- [ ] map.eachLayer(fn)
- [ ] map.invalidateSize(options?)
- [ ] map.getSize(), map.getPixelBounds(), map.getPixelOrigin()
- [ ] map.getMinZoom(), map.getMaxZoom(), map.setMinZoom(z), map.setMaxZoom(z)
- [ ] map.whenReady(fn)
- [ ] map.remove()

## Map Options
- [ ] center, zoom, minZoom, maxZoom
- [ ] dragging (enable/disable)
- [ ] inertia, inertiaDeceleration, inertiaMaxSpeed, easeLinearity
- [ ] scrollWheelZoom
- [ ] doubleClickZoom
- [ ] boxZoom
- [ ] keyboard
- [ ] zoomControl, attributionControl
- [ ] worldCopyJump
- [ ] maxBounds, maxBoundsViscosity
- [ ] zoomAnimation, zoomAnimationThreshold
- [ ] fadeAnimation, markerZoomAnimation

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
- [ ] L.tileLayer(urlTemplate, options).addTo(map)
- [ ] setUrl(url), setZIndex(z), setOpacity(opacity)
- [ ] options: tileSize, minZoom, maxZoom, subdomains, errorTileUrl, tms, opacity, updateWhenIdle
- [ ] WMS: L.tileLayer.wms(url, options)

## Overlays
- [ ] L.imageOverlay(url, bounds, options).addTo(map)
- [ ] L.videoOverlay(urls, bounds, options).addTo(map)
- [ ] L.svgOverlay(svgElement, bounds, options).addTo(map)

## Marker & Icon
- [ ] L.icon({ iconUrl, iconRetinaUrl, iconSize, iconAnchor, className })
- [ ] L.marker(latlng, { icon, title, alt, zIndexOffset, draggable })
- [ ] marker.addTo(map), marker.remove()
- [ ] marker.setLatLng(latlng), marker.getLatLng()
- [ ] marker.setIcon(icon), marker.setZIndexOffset()
- [ ] marker.bindPopup/popup events (see Popups)
- [ ] marker.bindTooltip/tooltip events (see Tooltips)
- [ ] marker dragging (interactive reposition)

## Layer Groups
- [ ] L.layerGroup(layers)
- [ ] L.featureGroup(layers)
- [ ] group.addLayer/removeLayer/clearLayers()
- [ ] group.eachLayer()
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
- [ ] L.polyline(latlngs, options)
- [ ] L.polygon(latlngs, options)
- [ ] L.circle(latlng, options)
- [ ] L.circleMarker(latlng, options)
- [ ] L.rectangle(bounds, options)
- [ ] Path options: color, weight, opacity, fill, fillColor, fillOpacity, lineCap, lineJoin, dashArray, className
- [ ] Path methods: addTo/remove, setStyle, bringToFront/Back, getBounds
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
- [ ] Custom CRS (L.CRS.*)
- [ ] Project/unproject helpers

## Panes & z-index
- [ ] map.createPane(name), getPane(name)
- [ ] pane ordering/z-index controls

## DOM Utilities (Optional)
- [ ] DomEvent on/off helpers
- [ ] setView animations via PosAnimation

## Performance & Extras (GT-native)
- [ ] (native) tiles: setOptions({ maxTiles, maxInflightLoads, interactionIdleMs })
- [ ] (native) tiles: setPrefetch({ enabled, baselineLevel })
- [ ] (native) screen cache: setScreenCache(true/false)
- [ ] (native) inertia tuning: setInertiaOptions
- [ ] (native) zoom-out center bias: setZoomOutCenterBias

---

Notes
- Check the items you need; we can prioritize implementation accordingly.
- Items marked (native) exist today via the native facades and can be plumbed into GT.L where it makes sense.
- DOM-based features (popups/tooltips/controls) will be lightweight overlays anchored to world position and updated on move/zoom.
