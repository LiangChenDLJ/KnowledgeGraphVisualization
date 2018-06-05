/*
<!DOCTYPE html>
<style>

.axis--y .domain {
    display: none;
}

</style>
<svg width="960" height="500"></svg>
    <script src="https://d3js.org/d3.v4.min.js"></script>
    <script>
*/

var initialDensityPlot = function(chartName, svgID, data, rangeX, kernelParam) {
    d3.select(svgID).selectAll('g').remove();
    d3.select(svgID).selectAll('path').remove();
    var n = data.length;
    if(n == 0) return;
    var svg = d3.select(svgID),
        width = + $(svgID).width(),
        height = + $(svgID).height(),
        margin = {top: 20, right: 30, bottom: 30, left: 40};

    var x = d3.scaleLinear()
        .domain(rangeX)
        .range([margin.left, width - margin.right]);

    var bins = d3.histogram().domain(x.domain()).thresholds(40)(data);
    possMax = 0;
    for(i in bins){
        if(bins[i].length > possMax) possMax = bins[i].length;
    }
    kernelParam = rangeX[1] - rangeX[0] > 0.1 ? (rangeX[1] - rangeX[0])/ 3 : 0.5;
    var density = kernelDensityEstimator(kernelEpanechnikov(kernelParam), x.ticks(40))(data);
    possMax /= n;
    for(i in density){
        if(density[0][1] > possMax) possMax = density[0][1];
    }
    var y = d3.scaleLinear()
        .domain([0, possMax])
        .range([height - margin.bottom, margin.top]);

    svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + (height - margin.bottom) + ")")
        .call(d3.axisBottom(x))
        .append("text")
        .attr("x", width - margin.right)
        .attr("y", -6)
        .attr("fill", "#000")
        .attr("text-anchor", "end")
        .attr("font-weight", "bold")
        .text(chartName);

    svg.append("g")
        .attr("class", "axis axis--y")
        .attr("transform", "translate(" + margin.left + ",0)")
        .call(d3.axisLeft(y).ticks(null, "%"));

        svg.insert("g", "*")
            .attr("fill", "#bbb")
            .selectAll("rect")
            .data(bins)
            .enter().append("rect")
            .attr("x", function (d) {
                return x(d.x0) + 1;
            })
            .attr("y", function (d) {
                return y(d.length / n);
            })
            .attr("width", function (d) {
                return x(d.x1) - x(d.x0) - 1;
            })
            .attr("height", function (d) {
                return y(0) - y(d.length / n);
            });

        svg.append("path")
            .datum(density)
            .attr("fill", "none")
            .attr("stroke", "#000")
            .attr("stroke-width", 1.5)
            .attr("stroke-linejoin", "round")
            .attr("d", d3.line()
                .curve(d3.curveBasis)
                .x(function (d) {
                    return x(d[0]);
                })
                .y(function (d) {
                    return y(d[1]);
                }));

        function kernelDensityEstimator(kernel, X) {
            return function (V) {
                return X.map(function (x) {
                    return [x, d3.mean(V, function (v) {
                        return kernel(x - v);
                    })];
                });
            };
        }

        function kernelEpanechnikov(k) {
            return function (v) {
                return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
            };
        }
}
/*
</script>
*/