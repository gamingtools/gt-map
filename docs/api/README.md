**@gaming.tools/gtmap**

***

# API Overview

Quick links to common tasks using the GTMap API.

- Create a map
  - See: api/Map/classes/GTMap.md (constructor)
- Configure tiles
  - See: api/Map/classes/GTMap.md#settilesource
- Change the view
  - Transition builder: api/Map/interfaces/ViewTransition.md
  - Start a transition: api/Map/classes/GTMap.md#transition
- Add content
  - Icons: api/Map/classes/GTMap.md#addicon
  - Markers: api/Map/classes/GTMap.md#addmarker
  - Vectors: api/Map/classes/GTMap.md#addvector
- Events
  - Map events: api/events/public/interfaces/MapEvents.md
  - Marker events: entities/Marker/classes/Marker.md (events property)
  - Layer events: entities/Layer/classes/Layer.md (events property)
- Utilities
  - Resize handling: api/Map/classes/GTMap.md#setautoresize and #invalidatesize
  - Performance: api/Map/classes/GTMap.md#setfpscap
  - Background: api/Map/classes/GTMap.md#setbackgroundcolor

Tip: The events pages list supported event names and payloads for IntelliSense.
