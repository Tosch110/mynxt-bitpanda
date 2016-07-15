        var coinimalUrl = "https://www.bitpanda.com/";
	var coinimalFoundUser = false;
	var coinimalLanguage = "eng";
	var coinimalSecLeft = 0;
        var coinimalPaymentSecLeft = 0;
	var coinimalLoadingHTML = '<p style="text-align: center; margin: 30px; font-weight: bold;">Loading...</p>';
   
        var coinimalExternalSystem = "mynxt";
	var coinimalToken = null;         // autorisierter TOKEN für website = "coinimal"
        var coinimalUsedAccountRs = null; // account RS des accounts der benutzt wird
        var coinimalUsedAccountPublicKey = null; // public key des accounts der benutzt wird
	
	// BUY inputs
      $("#CoinimalTradeAmountFiat").keyup(function(){
		var fiat = parseFloat($("#CoinimalTradeAmountFiat").val().replace(",", "."));
		var price = parseFloat($("#divCoinimalTradingEnabled").data("price"));
		var result = fiat / price;
		
		if (isNaN(fiat))
		{
			fiat = "---";
			result = "---";
		}
		else
		{
			fiat = $.number(fiat, 2);
			result = $.number(result, 4);
		}
		
		$("#coinimalAmountOfFiat").html(fiat);
		$("#coinimalYouGetCryptocoin").html(result);
	});
   
	function coinimalShowOrderSummary()
	{
		$("#divCoinimalOrderSummary").html(coinimalLoadingHTML);
		$("#coinimalModalOrderSummary").modal("show");
		coinimalSecLeft = 0; // timer stoppen
		
		// trade daten an coinimal schicken
		// danach summary anzeigen
		var tradeData = {};
		tradeData.type = "buy";
		tradeData.cryptocoin_id = 2;
		tradeData.amount_fiat = $("#CoinimalTradeAmountFiat").val();
		tradeData.payment_provider_id = $("#CoinimalTradePaymentProviderId").val();
		tradeData.cryptocoin_payout_address = coinimalUsedAccountRS;
		tradeData.nxt_publickey = coinimalUsedAccountPublicKey;
                tradeData.external_system = coinimalExternalSystem;
		
		$.ajax({
			url: coinimalUrl + "supernet/trade",
			type: "POST",
			data: {data: tradeData, token: coinimalToken},
			dataType: 'text',
			cache: false,
			crossDomain: true,
			success: function(data) {
				if (data.substring(0, 2) == "ok")
				{
					// PID speichern
					$("#btnCoinimalOrderSummary").data("pid", data.substring(3, data.length));
					$("#divCoinimalTradeButtons").show();
					
					coinimalNewRate();
				}
				else
				{
					// fehler anzeigen
					$("#divCoinimalOrderSummary").html(data);
					$("#divCoinimalTradeButtons").hide();
				}
			},
			error: function(xhr, ajaxOptions, thrownError) {
				alert("Unable to process order. " + xhr.status + ": " + thrownError);
			}
		});
	}
	
	function coinimalNewRate()
	{
		$("#divCoinimalOrderSummary").html(coinimalLoadingHTML);
		var pid = $("#btnCoinimalOrderSummary").data("pid");
	
		$.ajax({
			url: coinimalUrl + "supernet/buy_finalize/" + pid + "/new_rate",
			type: "POST",
			data: {token: coinimalToken},
			dataType: 'html',
			cache: false,
			crossDomain: true,
			success: function(data) {
				$("#divCoinimalOrderSummary").html(data);
				
				// timer starten
				if (coinimalSecLeft > 0)
				{
					// alter timer läuft anscheinend noch. nur zeit wieder erhöhen
					// sonst laufen 2 timer gleichzeitig
					coinimalSecLeft = 60;
				}
				else
				{
					coinimalSecLeft = 60;
					coinimalCountdown();
				}
			},
			error: function(xhr, ajaxOptions, thrownError) {
				alert("Unable to get new rate. " + xhr.status + ": " + thrownError);
			}
		});
	}
   
	function coinimalOrderNow(evt)
	{
		if ((!$('#coinimalCheckboxFinalAccept').is(':checked')) ||
                    ($('#coinimalCheckboxFinalTermsAccept').length && !$('#coinimalCheckboxFinalTermsAccept').is(':checked')))
		{
                  evt.preventDefault();
                  alert("Please check the checkbox!");
                  return false;
		}
		
		$("#divCoinimalOrderSummary").html('<p style="text-align: center; margin: 30px; font-weight: bold;">Ordering...</p>');
		$("#divCoinimalTradeButtons").hide();
		
		var pid = $("#btnCoinimalOrderSummary").data("pid");
	
		$.ajax({
			url: coinimalUrl + "supernet/buy_finalize/" + pid + "/save",
			type: "POST",
			data: {token: coinimalToken},
			dataType: 'text',
			cache: false,
			crossDomain: true,
			success: function(data) {
				
				if (data.substring(0, 2) == "ok")
				{
					// trade erfolgreich ausgeführt!
					// trade PID speichern und order success meldung anzeigen
					$("#btnCoinimalOrderSummary").data("trade-pid", data.substring(3, data.length));
					
					coinimalSuccessfullyOrdered();
				}
				else
				{
					// fehler anzeigen
					$("#divCoinimalOrderSummary").html(data);
					$("#divCoinimalTradeButtons").hide();
				}
			},
			error: function(xhr, ajaxOptions, thrownError) {
				alert("Unable to finish order. " + xhr.status + ": " + thrownError);
			}
		});
	}
	
	function coinimalSuccessfullyOrdered()
	{
		var tradePid = $("#btnCoinimalOrderSummary").data("trade-pid");
		
		$.ajax({
			url: coinimalUrl + "supernet/successfully_ordered/" + tradePid,
			type: "POST",
			data: {token: coinimalToken},
			dataType: 'html',
			cache: false,
			crossDomain: true,
			success: function(data) {
				$("#divCoinimalOrderSummary").html(data);
                                
                                // 10 minuten timer runterzählen
                                var timer = $("#coinimalRemainingTime");
                                var maxTime = timer.data("maxtime");
                                var start = timer.data("start");
                                var now = timer.data("now");
                                
                                var duration = now - start;
                                coinimalPaymentSecLeft = maxTime - duration;
                                
                                if (coinimalPaymentSecLeft > 0)
                                {
                                    coinimalPaymentCountdown();
                                }
                                else
                                    timer.html("Expired!");
			},
			error: function(xhr, ajaxOptions, thrownError) {
				alert("Unable to show successful order. " + xhr.status + ": " + thrownError);
			}
		});
	}
   
	function coinimalLoadPrice()
	{
		// reload price for selected cryptocoin
		$.ajax({
			url: coinimalUrl + "cryptocoins/getPrice/2/buy",
			cache: false,
			crossDomain: true,
			success: function(data) {
                              
                              $.each(data, function (key, val) {
					$('#CoinimalTradePaymentProviderId option[value="' + key + '"]').data("cryptocoin-base-price", val);
                              });
                              
                              priceChanged();
			},
			error: function(xhr, ajaxOptions, thrownError) {
				alert("Unable to load price. " + xhr.status + ": " + thrownError);
			}
		});
	}
        
        function priceChanged()
        {
          var price = $('#CoinimalTradePaymentProviderId option:selected').data("cryptocoin-base-price");
                              
          $("#divCoinimalTradingEnabled").data("price", price);
          $("span.coinimalCryptocoinPrice").text(price);
          
          if (price > 0)
          {
                  $("#CoinimalTradeAmountFiat").keyup();
                  
                  $("#divCoinimalTradingDisabled").hide();
                  $("#divCoinimalTradingEnabled").show();
                  
                  $("#divCoinimalOrderInputs").show();
          }
          else
          {
                  $("#divCoinimalTradingDisabled").show();
                  $("#divCoinimalTradingEnabled").hide();
                  
                  $("#divCoinimalOrderInputs").hide();
          }
        }
	
	function coinimalLoadPaymentProviders()
	{
		// payment providers option list
		$.ajax({
			url: coinimalUrl + "supernet/listPaymentProviders/" + coinimalLanguage,
			dataType: 'json',
			crossDomain: true,
			success: function(data) {
				$('#CoinimalTradePaymentProviderId').empty();
				var firstID = 0;
				
				$.each(data, function(i, entry) {
					if (firstID == 0) firstID = entry.id;
					$('#CoinimalTradePaymentProviderId').append($('<option>').text(entry.value).attr('value', entry.id));
				});
				
				// ersten payment provider auswählen
				$('#CoinimalTradePaymentProviderId').val(firstID);
                                
                                coinimalLoadPrice();
			},
			error: function(xhr, ajaxOptions, thrownError) {
				alert("Unable to load Payment providers. " + xhr.status + ": " + thrownError);
			}
		});
		
		// payment providers info text as HTML
		$.ajax({
			url: coinimalUrl + "supernet/showPaymentProviders/" + coinimalLanguage,
			dataType: 'html',
			crossDomain: true,
			success: function(data) {
				$("#coinimalPaymentProviders").html(data);
			}
		});
	}
	
	function coinimalCountdown()
	{
		if (coinimalSecLeft >= 1)
		{
			coinimalSecLeft = coinimalSecLeft - 1;
			$("#coinimalInfoPriceTimeLocked").html(coinimalSecLeft.toFixed(0));
			$("#btnCoinimalOrderNow").removeClass("disabled");
			setTimeout(coinimalCountdown, 1000);
		}
		else
		{
			$("#btnCoinimalOrderNow").addClass("disabled");
		}
	}
	
        
        function coinimalPaymentCountdown()
        {
            coinimalPaymentSecLeft--;
            
            if (coinimalPaymentSecLeft > 0)
            {
                var time = "00:00";
                var minutes = Math.floor(coinimalPaymentSecLeft / 60.0);
                seconds = coinimalPaymentSecLeft - (minutes * 60);
                
                if (minutes < 10) minutes = "0" + minutes;
                if (seconds < 10) seconds = "0" + seconds;
                time = minutes + ":" + seconds;
                
                $("#coinimalRemainingTime").html(time);
                
                // timer weiterlaufen lassen wenn element sichtbar ist
                if ($("#coinimalRemainingTime").is(":visible"))
                    setTimeout(coinimalPaymentCountdown, 1000);
                
                if (coinimalPaymentSecLeft % 5 == 0)
                {
                    // alle 5 sek status abfragen
                    coinimalReadInfo();
                }
            }
            else
                 $("#coinimalRemainingTime").html("Expired!");
        }
        
        function coinimalReadInfo()
        {
           var pid = $("#coinimalRemainingTime").data("pid");
           
            $.ajax({
                url: coinimalUrl + "supernet/readInfo/" + pid,
                dataType: "json",
                type: "POST",
		data: {token: coinimalToken},
                cache: false,
		crossDomain: true,
                success: function(data)
                {
                    if (data.internal_status == "unconfirmed_deposit" ||
                        data.internal_status == "got_payment")
                    {
                        // coins sind angekommen
                        $("#coinimalAlertRemainingTimeInfo").hide();
                        $("#coinimalAlertGotPayment").show();
                        coinimalPaymentSecLeft = 0;
                    }
                }
            })
        }
        
	// checken ob coinimal user account mit NXT account connected ist
	function coinimalFindUser()
	{
		$.ajax({
			url: coinimalUrl + "supernet/findUser",
			type: "POST",
			data: {token: coinimalToken},
			dataType: 'text',
			cache: false,
			crossDomain: true,
			success: function(data) {
			
				$("#coinimalDivFindingUser").hide();
				
				if (data.substring(0, 2) == "ok")
				{
					$("#coinimalDivUI").show();
					
					var vals = data.split(";");
					var email = vals[1];
					coinimalLanguage = vals[2];
					$("#coinimalFoundUserEmail").html("Connected with <b>" + email + "</b>");
					
					coinimalDrawPriceChart();
					coinimalLoadPaymentProviders();
				}
				else
				{
					$("#coinimalTokenTextarea").val(coinimalToken);
					$("#coinimalDivRegisterUser").show();
				}
			},
			error: function(xhr, ajaxOptions, thrownError) {
				alert("Unable to find connected Account. " + xhr.status + ": " + thrownError);
			}
		});
	}
   
	function make_y_axis(y) {        
		return d3.svg.axis()
			.scale(y)
			.orient("left")
				.ticks(5);
	}
	
	function coinimalDrawPriceChart()
	{
		// clear old graphs
		$("#coinimalPriceChart svg").remove();
		
		var margin = {top: 5, right: 5, bottom: 20, left: 15},
			width = $("#coinimalPriceChart").width() - margin.left - margin.right,
			height = $("#coinimalPriceChart").height() - margin.top - margin.bottom;
			
		var parseDate = d3.time.format("%Y%m%d%H").parse;
		var x = d3.time.scale().range([0, width]);
		var y = d3.scale.linear().range([height, 0]);
		var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(d3.time.day, 2).tickFormat(d3.time.format("%d.%m.%Y"));
		var yAxis = d3.svg.axis().scale(y).orient("left").ticks(5);
		
		var line = d3.svg.line().interpolate('basis')
			.x(function(d) { return x(d.date); })
			.y(function(d) { return y(d.price); });

		var area = d3.svg.area().interpolate('basis')
			.x(function(d) { return x(d.date); })
			.y0(height)
			.y1(function(d) { return y(d.price); });
			
		var svg = d3.select("#coinimalPriceChart").append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
		  .append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		
		$.ajax({
            url: coinimalUrl + 'historicPrices/chart/2',
            dataType: 'json',
            type: 'GET',
            timeout: 30000,
            crossDomain: true,
            success: function (data) {
		
				var percentage = 1.01;
			  data.forEach(function(d) {
				d.date = parseDate(d.hour_id);
				d.price = d.price * percentage;
			  });
			  
			  x.domain(d3.extent(data, function(d) { return d.date; }));
			  y.domain(d3.extent(data, function(d) { return d.price; }));
		
			  // gridlines
			  svg.append("g")         
				  .attr("class", "grid")
				  .call(make_y_axis(y)
					  .tickSize(-width, 0, 0)
					  .tickFormat("")
				  )
		
			  svg.append("g")
				  .attr("class", "x axis")
				  .attr("transform", "translate(0," + height + ")")
				  .call(xAxis);
			  
			  svg.append("g")
				  .attr("class", "y axis")
				  .attr("transform", "translate(" + width + " ,0)")  
				  .call(yAxis);
				  
				 svg.append("path")
				  .datum(data)
				  .attr("class", "order-price")
				  .attr("d", line);
				  
				svg.append("path")
					.datum(data)
					.attr("class", "areaPriceChart")
					.attr("d", area);
			}
		});
	}
   
	function coinimalInit()
	{
		if (!coinimalFoundUser)
		{
			$("#coinimalDivUI").hide();
			$("#coinimalDivRegisterUser").hide();
			
			$("#coinimalDivFindingUser").show();
			coinimalFindUser();
		}
	}

$(document).ready(function () {
  $("#btnCoinimalRefreshInit").click(coinimalInit);
  $("#btnCoinimalOrderSummary").click(coinimalShowOrderSummary);
  $("#btnCoinimalRefreshRate").click(coinimalNewRate);
  $("#btnCoinimalOrderNow").click(coinimalOrderNow);
  $("#CoinimalTradePaymentProviderId").change(priceChanged);
  
  MyNXT.getAccounts(function (result) {
    if (result.status == "success") {
      // use main account
      $.each(result.data.accounts, function(index, account) {
        if (account.bl_selected == 1)
        {
          coinimalUsedAccountRS = account.tx_account_rs;
          coinimalUsedAccountPublicKey = account.tx_public_key;
        }
      });
      
      if (coinimalUsedAccountRS)
      {
        var data = {
            requestType: 'generateToken',
            website: "coinimal",
            account: coinimalUsedAccountRS
        };
      
        MyNXT.sendTransaction(data, function (result) {
          coinimalToken = result.token;
          coinimalInit();
        });
      }
      else
        alert("No Main account found!");
    }
    else
      alert("Error: ".result.status);
  });
  
  

});