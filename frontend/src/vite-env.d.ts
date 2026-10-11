/// <reference types="vite/client" />

declare module 'plotly.js-dist-min' {
  const Plotly: any;
  export default Plotly;
}

declare module 'react-plotly.js/factory' {
  import { ComponentType } from 'react';
  import { PlotParams } from 'react-plotly.js';

  export default function createPlotlyComponent(plotly: any): ComponentType<PlotParams>;
}
