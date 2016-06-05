/* 
 * Sankey chart rendering app
 * 
 */


$(document).ready(function(){
    app.init();
});

_.extend(app, {
	format: {
		/*date: d3.time.format('%m/%d/%Y'),
		$dec: d3.format('$,.0f'),
		dec: d3.format(',.0f'),
		$mini: d3.format('$s'),
		mini: d3.format('s'),
		abbrev: function(_val){
			if(_val.key) _val = _val.key;
			return (_val.replace("Department", "Dept.")).replace("Committee", "Comm.");
		},
		ellipsis: function(_val){ 
			if(_val.key) _val = _val.key;
			return _val.length > 18 ? _val.substr(0, 15) + " . . ." : _val; 
		}*/	
	},
	
    init: function(){
		this.renderChart();
    },
    
    renderChart: function(){
		
		var formatNumber = d3.format("$,.0f"),
			format = function(d) { return formatNumber(d*1000); },
			color = d3.scale.category20b(),
			formatTitles = function(str){
				str = str.replace(" AND ", " & ");
				
				// titleCase
				return str.replace(/\w\S*/g, function(txt){
					return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
				});
			}
		
        var margin = {top: 1, right: 1, bottom: 6, left: 1},
			padding = {top: 0, right: 300, bottom: 0, left: 300},
			width = $("#chart").width() - margin.left - margin.right,
			height = $("#chart").height() - margin.top - margin.bottom;
		
		var svg = d3.select("#chart").append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
		  .append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		
		svg.append('linearGradient')
			.attr("id", "linkGradient")
			.attr("x1", 0).attr("y1", 0)
			.attr("x2", '100%').attr("y2", 0)
			.selectAll("stop")
			.data([
				{offset: "10%", color: "#6a3"},
				{offset: "90%", color: "#a91"}
			])
			.enter().append("stop")
			.attr("offset", function(d) { return d.offset; })
			.attr("stop-color", function(d) { return d.color; });
		
		var sankey = d3.sankey()
			.size([width, height])
			.nodeWidth(25)
			.nodePadding(3)
			.layout(32);
		
		var path = sankey.link();
		
		d3.csv("data/MergedData.csv", function(_rawData) {
			var dataset = [];
			_rawData.forEach(function(d) {
				d.TotalExpense = d.TotalExpense === "NA" ? 0 : d.TotalExpense;
				d.TotalBudget = d.TotalBudget === "NA" ? 0 : d.TotalBudget;
				dataset.push({
					id: d[""],
					dept: formatTitles(d["Department"].trim()),
					expcat: formatTitles(d["Expense_Category"].trim()),
					expense: +d["TotalExpense"]/1000,
					budget: +d["TotalBudget"]/1000
				});
		  	});
			
			// convert to node/link format
			var nodeNames = _.uniq(_.pluck(dataset, "dept"));
				nodeNames = nodeNames.concat(_.uniq(_.pluck(dataset, "expcat")));
				nodeNames.push("Overbudgeted Department Funds");
				nodeNames.push("Underbudgeted Department Funds");
			
			var nodes = [], ni = 0;
			nodeNames.forEach(function(d){
				nodes.push({order: ni++, name: d});
			});
			//nodes.push({name: "Underbudgeted"});
			
			var links = [], li = 0;
			dataset.forEach(function(d){
				links.push({
					order: li++,
					source: _.indexOf(nodeNames, d.dept), 
					target: _.indexOf(nodeNames, d.expcat),
					//value2: d.budget,
					value: d.expense
				});
			});
			var groupedByDept = _.groupBy(dataset, "dept");
			
			for(var k in groupedByDept){
				var g = groupedByDept[k],
					expenseSum = _.reduce(g, function(a, b){ return a + b.expense; }, 0),
					diff = expenseSum - g[0].budget;
				//console.debug(k, expenseSum > g[0].budget ? "over" : "under", g[0].budget - expenseSum)
				
				if(diff > 0){
					links.push({
						source: _.indexOf(nodeNames, g[0].dept), 
						target: _.indexOf(nodeNames, "Underbudgeted Department Funds"),
						//value2: expenseSum,
						value: diff
					});
				}else if(diff < 0){
					links.push({
						source: _.indexOf(nodeNames, g[0].dept), 
						target: _.indexOf(nodeNames, "Overbudgeted Department Funds"),
						//value2: g[0].budget,
						value: -diff
					});
				}else{
					// do nothing
				}
			}
			
			var groupedByExpCat = _.groupBy(dataset, "expcat");
			for(var k in groupedByExpCat){
				var g = groupedByExpCat[k]
					console.debug(k, g);
					
				/*
				if(diff > 0){
					
				}else if(diff < 0){
					
				}else{
					// do nothing
				}*/
			}
			
			
			app.links = links;
			app.nodes = nodes;
			
			sankey
			  .nodes(nodes)
			  .links(links)
			  .layout(32);

			// adjust node placement
			links.forEach(function(_l){
				_l.source.x = padding.left;
				_l.target.x = width - padding.right;
			});
			
			var link = svg.append("g").selectAll(".link")
			  .data(links)
			.enter().append("path")
			  .attr("class", "link")
			  .attr("d", path)
			  .style("stroke-width", function(d) { return Math.max(1, d.dy); })
			  .sort(function(a, b) { return b.dy - a.dy; });
			
			link.append("title")
			  .text(function(d) { return d.source.name + " → " + d.target.name + "\n" + format(d.value); });

			var node = svg.append("g").selectAll(".node")
			  .data(nodes)
			.enter().append("g")
			  .attr("class", "node")
			  .attr("transform", function(d) { 
				  return "translate(" + d.x + "," + d.y + ")";
			  })
			
			node.call(d3.behavior.drag()
			  .origin(function(d) { return d; })
			  .on("dragstart", function() { this.parentNode.appendChild(this); })
			  .on("drag", dragmove))
			  //.on("dragend", function(){ sankey.relayout(32); });

			node.append("rect")
			  .attr("height", function(d) { return d.dy; })
			  .attr("width", sankey.nodeWidth())
			  .style("fill", function(d) { return d.color = color(d.name.replace(/ .*/, "")); })
			  .style("stroke", function(d) { return d3.rgb(d.color).darker(1); })
			.append("title")
			  .text(function(d) { return d.name + "\n" + format(d.value); });

			node.append("text")
			  .attr("x", 8 + sankey.nodeWidth())
			  .attr("y", function(d) { return d.dy / 2; })
			  .attr("dy", ".35em")
			  .attr("text-anchor", "start")
			  .attr("transform", null)
			  .text(function(d) { return d.value > 10000 ? d.name : ""; })
			.filter(function(d) { return d.x < width / 2; })
			  .attr("x", 18 - sankey.nodeWidth())
			  .attr("text-anchor", "end");

			function dragmove(d) {
				d3.select(this).attr("transform", "translate(" + d.x + "," + (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")");
				sankey.relayout();
				
				link.attr("d", path);
				node.attr("transform", function(d) { 
				  return "translate(" + d.x + "," + d.y + ")";
				});
				//console.debug(d.y);
			}
			
			// add tooltips
			var tip = d3.tip().attr('class', 'd3-tip')
				.html(function(d) { return d.name + ": <span class='tipValue'>" + format(d.value); + "</span>"})
				.direction(function(d){
					return d.x < width / 2 ? 'e' : 'w';
				})
				.offset(function(d){
					return d.x < width / 2 ? [0, 10] : [0, -10];
				});
			svg.call(tip);

			d3.selectAll("g.node")
				.on('mouseover', tip.show)
				.on('mouseout', tip.hide);
		
		});
		
    }
});