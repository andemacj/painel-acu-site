globalThis.R71LocalContext={mount(map,data){
 const group=L.layerGroup().addTo(map);for(const [name,z] of [['r71Base',210],['r71Hydro',300],['r71Roads',450]]){map.createPane(name);map.getPane(name).style.zIndex=z;map.getPane(name).style.pointerEvents='none';}
 const styles={water:{pane:'r71Base',color:'#72afc8',weight:.7,fillColor:'#d2ebf3',fillOpacity:1},rivers:{pane:'r71Hydro',color:'#71aec6',weight:1.2,opacity:.85},roads:{pane:'r71Roads',color:'#776d52',weight:1.5,opacity:.65}};
 for(const k of ['water','rivers','roads'])if(data?.layers[k])L.geoJSON(data.layers[k],{pane:styles[k].pane,renderer:L.canvas({pane:styles[k].pane}),interactive:false,style:styles[k]}).addTo(group);
 map.attributionControl.addAttribution('<a href="https://www.ibge.gov.br/geociencias/cartas-e-mapas/bases-cartograficas-continuas/15759-brasil.html" target="_blank" rel="noopener">IBGE BC250 2023</a> · contexto local 1:250.000');
 group._r71Local=true;group._r71Sources=Object.keys(data?.layers||{});return group;
}};
