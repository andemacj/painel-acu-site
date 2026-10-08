/* Compatibility with the installed adapter 0.0.22 and MapLibre 5.6.2.
 * Leaflet owns the camera; its zoom convention is GL zoom + 1.
 * MapLibre's current transform exposes read-only center/zoom accessors.
 * Keep the adapter event/offset/zoom lifecycle; use the public camera API. */
(()=>{'use strict';
 const Synced=L.MaplibreGL.extend({
  _transformGL(gl){const c=this._map.getCenter();gl.jumpTo({center:[c.lng,c.lat],zoom:this._map.getZoom()-1,bearing:0,pitch:0});}
 });
 window.R73MaplibreLayer=options=>new Synced({...options,updateInterval:0});
})();
