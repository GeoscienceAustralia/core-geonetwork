(function() {
  goog.provide('gn_map_directive');

  angular.module('gn_map_directive', [])

    .directive(
      'gnDrawBbox',
      [
       'gnMapProjection',
       function(gnMapProjection) {
         return {
           restrict: 'A',
           replace: true,
           templateUrl: '../../catalog/components/common/map/' +
           'partials/drawbbox.html',
           scope: {
             htopRef: '@',
             hbottomRef: '@',
             hleftRef: '@',
             hrightRef: '@',
             lang: '='
           },
           link: function(scope, element, attrs) {
             scope.drawing = false;
             scope.mapId = 'map-drawbbox-' +
             scope.htopRef.substring(1, scope.htopRef.length);

             /**
              * Different projections used in the directive:
              * - md : the proj system in the metadata. It is defined as
              *   4326 by iso19139 schema
              * - map : the projection of the ol3 map, this projection
              *   is set in GN settings
              * - form : projection used for the form, it is chosen
              *   from the combo list.
              */
             scope.projs = {
               list: ['EPSG:4326', 'EPSG:3857'],
               md: 'EPSG:4326',
               map: 'EPSG:3857',
               form: 'EPSG:3857'
             };

             scope.extent = {
               md: [parseFloat(attrs.hleft), parseFloat(attrs.hbottom),
                      parseFloat(attrs.hright), parseFloat(attrs.htop)],
               map: [],
               form: []
             };

             var reprojExtent = function(from, to) {
               scope.extent[to] = gnMapProjection.reprojExtent(
                   scope.extent[from],
                   scope.projs[from], scope.projs[to]
               );
             };

             // Init extent from md for map and form
             reprojExtent('md', 'map');
             reprojExtent('md', 'form');

             scope.$watch('projs.form', function(newValue, oldValue) {
               scope.extent.form = gnMapProjection.reprojExtent(
                   scope.extent.form, oldValue, newValue
               );
             });

             var boxStyle = new ol.style.Style({
               stroke: new ol.style.Stroke({
                 color: 'rgba(255,0,0,1)',
                 width: 2
               }),
               fill: new ol.style.Fill({
                 color: 'rgba(255,0,0,0.3)'
               })
             });

             var feature = new ol.Feature();
             var source = new ol.source.Vector();
             source.addFeature(feature);

             var bboxLayer = new ol.layer.Vector({
               source: source,
               styleFunction: function(feature, resolution) {
                 return [boxStyle];
               }
             });

             var map = new ol.Map({
               layers: [
                 new ol.layer.Tile({
                   source: new ol.source.OSM()
                 }),
                 bboxLayer
               ],
               renderer: ol.RendererHint.CANVAS,
               view: new ol.View2D({
                 center: [0, 0],
                 zoom: 2
               })
             });

             var dragbox = new ol.interaction.DragBox({
               style: boxStyle,
               condition: function() {
                  return scope.drawing;
               }
             });

             dragbox.on('boxstart', function(mapBrowserEvent) {
               feature.setGeometry(null);
             });

             dragbox.on('boxend', function(mapBrowserEvent) {
               scope.extent.map = dragbox.getGeometry().getExtent();
               feature.setGeometry(dragbox.getGeometry());

               scope.$apply(function() {
                 reprojExtent('map', 'form');
                 reprojExtent('map', 'md');
               });
             });

             map.addInteraction(dragbox);

             /**
              * Draw the map extent as a bbox onto the map.
              */
             var drawBbox = function() {
               var coordinates = gnMapProjection.
               getCoordinatesFromExtent(scope.extent.map);

               var geom = new ol.geom.Polygon([coordinates]);
               feature.setGeometry(geom);

               feature.getGeometry().setCoordinates(coordinates);
             };

             /**
              * When form is loaded
              * - set map div
              * - draw the feature with MD initial coordinates
              * - fit map extent
              */
             scope.$watch('gnCurrentEdit.version', function(newValue) {
               map.setTarget(scope.mapId);
               drawBbox();
               if (scope.extent.map[0] && scope.extent.map[1] &&
                   scope.extent.map[2] && scope.extent.map[3]) {
                 map.getView().fitExtent(scope.extent.map, map.getSize());
               }
             });

             /**
              * Switch mode (panning or drawing)
              */
             scope.drawMap = function() {
               scope.drawing = !scope.drawing;
             };

             /**
              * Called on form input change.
              * Set map and md extent from form reprojection, and draw
              * the bbox from the map extent.
              */
             scope.updateBbox = function() {

               reprojExtent('form', 'map');
               reprojExtent('form', 'md');

               drawBbox();
             };

             /**
              * Callback sent to gn-country-picker directive.
              * Called on region selection from typeahead.
              * Zoom to extent.
              */
             scope.onRegionSelect = function(region) {
               var extent = [parseFloat(region.west),
                             parseFloat(region.south),
                             parseFloat(region.east),
                             parseFloat(region.north)];

               var extentMap = gnMapProjection.reprojExtent(
                   extent, scope.projs.md, scope.projs.map
               );
               map.getView().fitExtent(extentMap, map.getSize());
             };
           }
         };
       }]);
})();