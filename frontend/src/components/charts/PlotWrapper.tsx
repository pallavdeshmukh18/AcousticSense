import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';

// Create a dedicated Plotly React component bound to plotly.js-dist-min
export const Plot = createPlotlyComponent(Plotly);
export default Plot;
