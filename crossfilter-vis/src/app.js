/*
 * This code handles the dc.js chart generation.
 *
 */


$(document).ready(function(){
    app.init();
});

/* * * From dc utils * * */
dc.pluck = function (n, f) {
	if (!f) {
        return function (d) { return d[n]; };
    }
    return function (d, i) { return f.call(d, d[n], i); };
};

_.extend(app, {
    el: $("main"),
    w: $("main .charts").width() - 100,
	mousedown: 0,
	data: {},
	format: {
		date: d3.time.format('%m/%d/%Y'),
        monthLetter: function(val){
            var abbrev =  d3.time.format('%b')(val)
            return abbrev.substr(0, 1);
        },
		$dec: d3.format('$,.0f'),
		dec: d3.format(',.0f'),
		$mini: d3.format('$s'),
		mini: d3.format('s'),
		abbrev: function(_val){
			if(_val.key) _val = _val.key;
			return (_val.replace("Department", "Dept.")).replace("Committee", "Comm.");
		},
		/*ellipsis: function(_val){
			if(_val.key) _val = _val.key;
			return _val.length > 25 ? _val.substr(0, 22) + "..." : _val;
		},*/
        titles: function(str) {
            if(str.key) str = str.key;
            str = str.length > 36 ? str.substr(0, 33) + "..." : str;

            str = str.replace(" AND ", " & ");

            // titleCase
            return str.replace(/\w\S*/g, function(txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        }
	},

    init: function(){

        NProgress.configure({ showSpinner: true });
        NProgress.start();

		this.chartGrids = $('.charts').masonry({
		  	itemSelector: '.chart-block',
		  	columnWidth: '.chart-sizer',
		 	percentPosition: true
		});

		this.loadData();
    },

    loadData: function(){
        var self = this;
        NProgress.inc();

		queue()
		    .defer(d3.csv, "data/Expenditures_new.csv",
				function (d) {
					NProgress.inc();
                    var date = new Date(d["Payment_Issue_date"]);
					return {
                        date: date,
                        week: d3.time.week(date),
                        dept: d["Department"].trim(),
						expcat: d["Expense_Category"].trim(),
                        vendor: d["Vendor_Name"].trim(),
                        amount: d["Amount"].substr(1)
					};
        	})
			.await(allLoaded)

		function allLoaded(error, expenditures){
			if(error) console.warn(error);
			NProgress.set(.5);

			self.data.expenditures = expenditures;

			queue()
				.defer(self.renderExpenditures, self)
				.awaitAll(allRendered)
		}
		function allRendered(error){
			console.debug("all rendered");
			if(error) console.warn(error);
			NProgress.done();
		}
    },

	lineChartDefaults: function(_chart, _color, _container, _format){
		var self = this,
			$chartsContainer = _container.find(".charts");

		_chart.width(this.w) //.height(160)
			.margins({top: 4, right: 10, bottom: 20, left: 55})
			.xUnits(d3.time.weeks)
			.round(d3.time.week.round)
			.ordinalColors([_color])
			.yAxisPadding("10%")
			.elasticY(true)
			.renderArea(true)
			.interpolate('step')
			//.interpolate('bundle')
			.renderDataPoints(true)
			//.clipPadding(10)
			/*.on("preRender", function(){

			})
			.on("postRender", function(){

			})
			.on("preRedraw", function(){

			})
			.on("postRedraw", function(){

			});*/
		_chart.yAxis().ticks(5).tickFormat(this.format[_format]);
	},
	rowChartDefaults: function(_chart, _color, _leftMargin, _tipHtml, _format, _renderlet){
		var self = this;

		_chart.width(this.w/3)
			.margins({top: 4, right: 10, bottom: 20, left: _leftMargin})
			.labelOffsetX("-5px")
			.elasticX(true)
			.ordering(function(d){return -d.value})
			.ordinalColors([_color])
            .gap(1)
			.on("renderlet", function(chart){
				self.addTooltip(chart, _tipHtml);

				if(_renderlet) _renderlet(chart);
			});
		_chart.xAxis().ticks(4).tickFormat(this.format[_format]);
	},
	pieChartDefaults: function(_chart, _color, _tipHtml, _container){
		var self = this,
			$chartsContainer = _container.find(".charts");
		_chart.width(this.w/3).height(200)
			//.slicesCap(4)
			.innerRadius(20)
			.ordinalColors([_color, 'hsl(350, 5%, 45%)'])
			.on("renderlet", function(chart){ self.addTooltip(chart, _tipHtml); })
			.on("preRender", function(){
				if(self.mousedown === 0) self.showLoading($chartsContainer);
			})
			.on("postRender", function(){
				self.hideLoading($chartsContainer);
			})
			.on("preRedraw", function(){
				if(self.mousedown === 0) self.showLoading($chartsContainer);
			})
			.on("postRedraw", function(){
				self.hideLoading($chartsContainer);
			});
	},
	addTooltip: function(_chart, _html){
		$(".d3-tip.c-" + _chart.chartID()).remove();

		var tip = d3.tip().attr('class', 'd3-tip c-' + _chart.chartID())
			.html(_html)
			.direction('e')
			.offset([0, 10]);
		_chart.svg().call(tip);

		d3.selectAll(_chart.anchor() + " g.row rect, " + _chart.anchor() + " circle.dot")
			.on('mouseover', tip.show)
			.on('mouseout', tip.hide);
	},
	addVerticalLine: function(_chart, _x, _year, _dir, _color, _label){
		var t = _x.getTime(),
			lineData = [{x: _chart.x()(_x), y: _chart.y().range()[0]},
					  	{x: _chart.x()(_x), y: _chart.y().range()[1]}];

		var line = d3.svg.line()
			.x(function(d) { return d.x; })
			.y(function(d) { return d.y; })
			.interpolate('linear');

		_chart.select("g.t-" + t).remove();
		var group = _chart.select('g.chart-body').append("g").attr("class", "t-" + t);
		group.selectAll('line.line-' + _year).data([_label]).enter()
		  .append('line').attr('class', 'line t-' + t)
			.attr("x1", function(){return _chart.x()(_x); })
			.attr("x2", function(){return _chart.x()(_x); })
			.attr("y1", function(){return _chart.y().range()[0]; })
			.attr("y2", function(){return _chart.y().range()[1]; })
			.attr('stroke', _color)
			.attr('stroke-dasharray', '4, 2')
			.attr('stroke-width', .75)
			.attr('stroke-opacity', 1);

		group.selectAll("text.label-" + _year).data([_label]).enter()
		  .append("text").attr("class", 'label t-' + t)
			.attr("x", _chart.x()(_x))
			.attr("y", 0)
			.attr("dx", _dir === "L" ? -4 : 4)
			.attr("dy", 12)
			.attr('fill', _color)
			.attr("text-anchor", _dir === "L" ? "end" : "start")
			.text(function(d){return d;});
	},

	setupHiddenChart(_container, _cf, _chartGroup){
        var self = this,
			hiddenChart = dc.rowChart('#' + _chartGroup + '-hidden-chart', _chartGroup),
			hiddenDim = _cf.dimension( function(p) { return p.week; } ),
            hiddenGroup = hiddenDim.group().reduceSum(dc.pluck('amount'));

		hiddenChart
			.dimension(hiddenDim).group(hiddenGroup)
			.on("renderlet", function(chart){
				var amount = _.reduce(_.pluck(chart.group().all(), "value"), function(a, b){ return a + parseFloat(b); });
				_container.find(".totals .amount").html(self.format.$dec(Math.round(amount)));
				_container.find(".totals .size").html(self.format.dec(chart.dimension().top(1e9).length));
			});
	},

	renderExpenditures: function(self, callback){
        NProgress.inc();
		var w = $("main .charts").width() - 210,
			color = 'hsl(190, 55%, 45%)',
			tipHtml = function(d) { return self.format.$dec(d.value); },
			$container = $("#expenditures");

        var dateChart = dc.lineChart('#expend-date-chart', 'expend'),
            countChart = dc.lineChart('#expend-count-chart', 'expend'),
			expcatChart = dc.rowChart('#expend-expcat-chart', 'expend'),
			deptChart = dc.rowChart('#expend-dept-chart', 'expend'),
            vendorChart = dc.rowChart('#expend-vendor-chart', 'expend');

        var cf = crossfilter(self.data.expenditures),
            all = cf.groupAll();

		var weekDim = cf.dimension( function(p) { return p.week; } ),
			amountWeekGroup = weekDim.group().reduceSum(dc.pluck('amount'));
        var countDim = cf.dimension( function(p) { return p.week; } ),
			amountCountGroup = countDim.group();
		var expcatDim = cf.dimension( function(p) { return p.expcat; } ),
            amountExpcatGroup = expcatDim.group().reduceSum(dc.pluck('amount'));
		var deptDim = cf.dimension( function(p){ return p.dept; } ),
			amountDeptGroup = deptDim.group().reduceSum(dc.pluck('amount'));
        var vendorDim = cf.dimension( function(p){ return p.vendor; } ),
			amountVendorGroup = vendorDim.group().reduceSum(dc.pluck('amount'));

		self.setupHiddenChart($container, cf, 'expend');

		dateChart.height(150)
			.dimension(weekDim).group(amountWeekGroup)
			.x(d3.time.scale().domain([new Date(2013, 11, 1), new Date(2016, 1, 1)]))
			.on("renderlet", function(_chart) {
                self.addVerticalLine(_chart, new Date(2014, 0, 1), 2014, "R", "#999", "2014");
				self.addVerticalLine(_chart, new Date(2015, 0, 1), 2015, "R", "#999", "2015");
                self.addVerticalLine(_chart, new Date(2016, 0, 1), 2016, "R", "#999", "2016");
			});
		self.lineChartDefaults(dateChart, color, $container, "$mini");
		dateChart.xAxis().ticks(20).tickFormat(self.format.monthLetter);
		dateChart.render();

        countChart.height(100)
			.dimension(countDim).group(amountCountGroup)
			.x(d3.time.scale().domain([new Date(2013, 11, 1), new Date(2016, 1, 1)]))
            .renderArea(false)
			.on("renderlet", function(_chart) {
                self.addVerticalLine(_chart, new Date(2014, 0, 1), 2014, "R", "#999", "2014");
				self.addVerticalLine(_chart, new Date(2015, 0, 1), 2015, "R", "#999", "2015");
                self.addVerticalLine(_chart, new Date(2016, 0, 1), 2016, "R", "#999", "2016");
			});
		self.lineChartDefaults(countChart, color, $container, "mini");
		countChart.xAxis().ticks(20).tickFormat(self.format.monthLetter);
		countChart.render();

		expcatChart.height(570)
            .dimension(expcatDim).group(amountExpcatGroup)
            .data(function(group){ return group.top(40); })
			.label(self.format.titles)
		self.rowChartDefaults(expcatChart, color, 180, tipHtml, "$mini");

        deptChart.height(570)
			.dimension(deptDim).group(amountDeptGroup)
            .label(self.format.titles)
		self.rowChartDefaults(deptChart, color, 180, tipHtml, "$mini");

        vendorChart.height(570)
			.dimension(vendorDim).group(amountVendorGroup)
            .data(function(group){ return group.top(40); })
            .label(self.format.titles)
		self.rowChartDefaults(vendorChart, color, 180, tipHtml, "$mini");

		dc.renderAll('expend');
		callback(null);
    },

});
