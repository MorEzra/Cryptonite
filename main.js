(function () {
    $(function () {
        const URLentireCoinList = "https://api.coingecko.com/api/v3/coins"

        //the place where i display all my coin cards
        let coinBoard = $("#coinBoard");

        // * * * * *
        //CACHES
        //the cache which holds all the displayed cards
        let coinsCache = new Array();

        //the cache which holds more infos
        let moreInfoCache = new Map();

        //the cache which holds the checked toggles
        let toggleState = new Array();

        //duplicated, in case that user makes changes on modal
        let updatedToggleState = new Array();

        //detailed version - for display on modal
        let detailedToggleState = new Array();

        // * * * * *

        //on page load
        if (isCacheEmpty(coinsCache)) {
            getCoinsDataFromServer();
        } else {
            showCoinsOnBoardUI(coinsCache);
        }

        // * * * * *
        //NAVBAR
        //define navbar clicks
        let home = $("#home");
        home.click(onShowHomepageClicked);

        let aboutMe = $("#aboutMe");
        aboutMe.click(onShowAboutMeClicked);

        let liveReports = $("#liveReports");
        liveReports.click(onShowLiveReportsClicked);

        //define search bar
        let searchCoinInput = $("#searchCoinInput");

        let searchCoinBTN = $("#searchCoinBTN");
        searchCoinBTN.click(onSearchBTNclicked);

        // * * * * *



        // * * * * *

        // FUNCTIONS

        function getCoinsDataFromServer() {
            $.get(URLentireCoinList).then(
                function (coins) {
                    //create the cache - get only 100 records and save them
                    //I know that there are only 50 coins in this URL, but I want to show my method of getting only 100 coins.
                    coinsCache = coins.slice(0, 100);
                    showCoinsOnBoardUI(coinsCache);
                })
                .catch(error => console.log(error));
        }

        //  -----> CARD CREATION <-----
        function showCoinsOnBoardUI(coins) {
            //clear the board of previous cards
            clearCoinBoard();

            for (let coin of coins) {
                let card = createCardBox(coinBoard);

                let cardBody = createCardBody(card);

                createCardTitle(cardBody, coin);

                createCoinSymbol(cardBody, coin);

                createMoreInfoBTN(cardBody, coin)

                let toggleLabel = createToggleLabel(cardBody);

                createToggleBTN(toggleLabel, coin);

                createToggleShape(toggleLabel);
            }
        }

        function createCardBox(coinBoard) {
            let card = $("<div>");
            card.addClass("card");
            coinBoard.append(card);
            return card;
        }

        function createCardBody(card) {
            let cardBody = $("<div>");
            cardBody.addClass("card-body");
            card.append(cardBody);
            return cardBody;
        }

        function createCardTitle(cardBody, coin) {
            let title = $("<p>");
            title.addClass("card-title");
            title.html(coin.symbol);
            cardBody.append(title);
        }

        function createCoinSymbol(cardBody, coin) {
            let coinSymbol = $("<p>");
            coinSymbol.addClass("card-text");
            coinSymbol.html(coin.id);
            cardBody.append(coinSymbol);
        }

        function createToggleLabel(cardBody) {
            let toggleLabel = $("<label>");
            toggleLabel.addClass("switch");
            cardBody.append(toggleLabel);
            return toggleLabel;
        }

        function createMoreInfoBTN(cardBody, coin) {
            let moreInfoBTN = $("<button>");
            moreInfoBTN.addClass("btn btn-outline-info");
            moreInfoBTN.attr("id", coin.id);
            moreInfoBTN.click(onMoreInfoClicked);
            moreInfoBTN.text("More Info");
            cardBody.append(moreInfoBTN);
        }

        function createToggleBTN(toggleLabel, coin) {
            let toggleBTN = $("<input>");
            toggleBTN.attr("type", "checkbox");
            toggleBTN.attr("id", coin.symbol);
            toggleBTN.addClass("checkbox");
            toggleBTN.change(onToggleClicked);
            toggleLabel.append(toggleBTN);

            //update checked toggles by state
            if (toggleState.includes(coin.symbol)) {
                toggleBTN.attr("checked", "checked");
            }
        }

        function createToggleShape(toggleLabel) {
            let toggleShape = $("<span>");
            toggleShape.addClass("slider round");
            toggleLabel.append(toggleShape);
        }

        // * * for modal usage only

        function createModalToggleBTN(toggleLabel, coin) {
            let toggleBTN = $("<input>");
            toggleBTN.attr("type", "checkbox");
            toggleBTN.attr("id", coin.symbol);
            toggleBTN.attr("checked", "checked");
            toggleBTN.addClass("checkbox");
            toggleBTN.click(() => onModalToggleClicked(coin, toggleBTN));
            toggleLabel.append(toggleBTN);
        }


        //  -----> SWITCH BUTTON <-----
        function onToggleClicked() {
            let currentToggle = $(this);
            let currentCoinSymbol = currentToggle[0].id;

            setToggleState(currentCoinSymbol, currentToggle, toggleState);

            checkCheckedTogglesLimit();
        }

        function setToggleState(currentCoinSymbol, currentToggle, currentToggleState) {
            if (currentToggle.prop("checked") == true) {
                currentToggle.attr("checked", "checked");
                //save to toggles state
                currentToggleState.push(currentCoinSymbol);
            } else {
                currentToggle.removeAttr("checked");
                let coinIndexToRemove = currentToggleState.indexOf(currentCoinSymbol);
                //remove from toggles state
                currentToggleState.splice(coinIndexToRemove, 1);
            }
        }

        //  -----> MORE INFO <-----
        function onMoreInfoClicked() {
            let currentButton = $(this);

            if (currentButton.hasClass("IamVisible")) {
                currentButton.removeClass("IamVisible");
                hideCollapserOnUI(currentButton);
            } else {
                currentButton.addClass("IamVisible");
                showMoreInfo(currentButton);
            }
        }

        function showMoreInfo(currentButton) {
            let currentCardBody = currentButton.parent();

            //get necessary details by coin name
            let currentCoin = currentButton[0].id;

            if (moreInfoCache.has(currentCoin)) {
                console.log("getting data from cache");

                let coinInfo = moreInfoCache.get(currentCoin);

                showCollapserOnUI(currentButton, currentCardBody, coinInfo);
            } else {
                console.log("getting data from server");

                //to prevent a bug of double-get request sent to the server!
                currentButton.prop("disabled", true);
                currentButton.html("Hang on...");

                createPreloader(currentCardBody, currentCoin);

                $.get(URLentireCoinList + "/" + currentCoin).then(
                    function (currentCoinDetails) {
                        let ilsCurrency = currentCoinDetails.market_data.current_price.ils;
                        let usdCurrency = currentCoinDetails.market_data.current_price.usd;
                        let eurCurrency = currentCoinDetails.market_data.current_price.eur;
                        let coinImage = currentCoinDetails.image.large;

                        //I gather the values I want to hold
                        let coinInfo = {
                            ils: ilsCurrency,
                            usd: usdCurrency,
                            eur: eurCurrency,
                            coinImage: coinImage
                        }

                        //save for cache
                        moreInfoCache.set(currentCoin, coinInfo);

                        //hold coin rates info for 2 minutes
                        setTimeout(function () {
                            moreInfoCache.delete(currentCoin);
                        }, 120000);

                        showCollapserOnUI(currentButton, currentCardBody, coinInfo);

                        currentButton.prop("disabled", false);

                        hidePreloader(currentCoin);
                    })
                    .catch(error => console.log(error));
            }
        }

        function showCollapserOnUI(currentButton, currentCardBody, coinInfo) {
            currentButton.html("Hide");

            let collapser = createCollapser(currentCardBody, currentButton);

            // * * ILS * *

            let ilsImgSrc = "ils";
            createCurrencySymbol(collapser, ilsImgSrc);

            let ilsCoinVal = coinInfo.ils;
            createCurrencyValuePar(collapser, ilsCoinVal);

            // * * USD * *

            let usdImgSrc = "usd";
            createCurrencySymbol(collapser, usdImgSrc);

            let usdCoinVal = coinInfo.usd;
            createCurrencyValuePar(collapser, usdCoinVal);

            // * * EUR * *

            let eurImgSrc = "eur";
            createCurrencySymbol(collapser, eurImgSrc);

            let eurCoinVal = coinInfo.eur;
            createCurrencyValuePar(collapser, eurCoinVal);

            // * * CURRENT COIN * *
            let coinImg = coinInfo.coinImage;
            createCoinImage(coinImg, collapser);
        }

        function hideCollapserOnUI(currentButton) {
            currentButton.html("More Info");
            $(".collapser#" + currentButton[0].id).remove();
        }

        //  -----> COLLAPSER CREATION <-----
        
        function createCollapser(currentCardBody, currentButton) {
            let collapser = $("<div>");
            collapser.addClass("collapser");
            collapser.attr("id", currentButton[0].id);
            currentCardBody.append(collapser);
            return collapser;
        }

        function createCurrencySymbol(collapser, imageSrc) {
            let coinImg = $("<img>");
            coinImg.addClass("moreInfoImage");
            coinImg.attr("src", `./image/icons/${imageSrc}.svg`);
            collapser.append(coinImg);
        }

        function createCurrencyValuePar(collapser, coinVal) {
            coinValPar = $("<p>");
            coinValPar.addClass("moreInfoText");
            coinValPar.html(coinVal);
            collapser.append(coinValPar);
        }

        function createCoinImage(coinImg, collapser) {
            let image = $("<img>");
            image.addClass("currencyImage");
            image.attr("src", coinImg);
            collapser.append(image);
        }

        function isCacheEmpty(coinsCache) {
            if (coinsCache.length == 0) {
                return true;
            }
            return false;
        }

        let clearCoinBoard = () => coinBoard.empty();

        //  -----> MODAL <-----
        function checkCheckedTogglesLimit() {
            //limit to 5 choices
            if (toggleState.length > 5) {
                //get coin details to display on UI
                for (let index = 0; index < toggleState.length; index++) {
                    let detailedToggleStateInfo = coinsCache.find(val => val.symbol == toggleState[index]);
                    detailedToggleState[index] = detailedToggleStateInfo;
                }

                updatedToggleState = toggleState.slice();
                createModalOnUI();
            }
        }

        function createModalOnUI() {
            let modalBG = createDarkBG();

            let modalContainer = createModalBox(modalBG);

            createModalHeader(modalContainer);

            let modalBody = createModalBody(modalContainer);

            showCoinsOnModalUI(modalBody, detailedToggleState);

            let modalFooter = createModalFooter(modalContainer);

            createSaveButton(modalFooter);

            createCancelButton(modalFooter);
        }

        //  -----> MODAL CREATION <-----
        function createDarkBG() {
            modalBG = $("<div>");
            modalBG.addClass("popUp");
            $("body").append(modalBG);
            return modalBG;
        }

        function createModalBox(modalBG) {
            modalContainer = $("<div>");
            modalContainer.addClass("modalContainer")
            modalBG.append(modalContainer);
            return modalContainer;
        }

        function createModalHeader(modalContainer) {
            let modalHeader = $("<div>");
            modalHeader.addClass("modalHeader");
            modalHeader.html("You can choose only 5 coins for live reports.<br>Please choose a coin to remove or go back to previous choice.");
            modalContainer.append(modalHeader);
        }

        function createModalBody(modalContainer) {
            modalBody = $("<div>");
            modalBody.addClass("modalBody");
            modalContainer.append(modalBody);
            return modalBody;
        }

        function createModalFooter(modalContainer) {
            modalFooter = $("<div>");
            modalFooter.addClass("modalFooter");
            modalContainer.append(modalFooter);
            return modalFooter;
        }

        function createSaveButton(modalFooter) {
            let saveButton = $("<button>");
            saveButton.addClass("btn btn-info");
            saveButton.attr("id", "saveButton");
            saveButton.text("Save changes");
            saveButton.click(onSaveButtonClicked);
            modalFooter.append(saveButton);
        }

        function createCancelButton(modalFooter) {
            let cancelButton = $("<button>");
            cancelButton.addClass("btn btn-secondary");
            cancelButton.attr("id", "cancelButton");
            cancelButton.text("Cancel");
            cancelButton.click(onCancelButtonClicked);
            modalFooter.append(cancelButton);
        }

        function showCoinsOnModalUI(modalBody, coins) {
            for (let coin of coins) {
                let card = createCardBox(modalBody);

                let cardBody = createCardBody(card);

                createCardTitle(cardBody, coin);

                createCoinSymbol(cardBody, coin);

                let toggleLabel = createToggleLabel(cardBody);

                createModalToggleBTN(toggleLabel, coin);

                createToggleShape(toggleLabel);
            }
        }

        function onModalToggleClicked(coin, toggleBTN) {
            let currentCoinSymbol = coin.symbol;

            setToggleState(currentCoinSymbol, toggleBTN, updatedToggleState);
        }

        function onSaveButtonClicked() {
            //VALIDATION
            if (updatedToggleState.length == 6) {
                alert("You can save only 5 coins for live reports.\nPlease fix your choice");
                return;
            }

            $(".popUp").remove();

            toggleState = updatedToggleState;

            showCoinsOnBoardUI(coinsCache);
        }

        function onCancelButtonClicked() {
            $(".popUp").remove();

            //remove the last added toggle
            toggleState.pop();

            showCoinsOnBoardUI(coinsCache);
        }

        //  -----> NAV ELEMENTS <-----
        function onShowHomepageClicked() {
            activateNecessaryOnNavUI(home, aboutMe, liveReports);

            //init live report object, chart and other "pages" when I move to homepage
            initLiveReports();
            clearCoinBoard();
            hideContent($("#aboutMePage"));

            showCoinsOnBoardUI(coinsCache);
        }

        function onShowAboutMeClicked() {
            activateNecessaryOnNavUI(aboutMe, home, liveReports);

            initLiveReports();
            clearCoinBoard();

            showContent($("#aboutMePage"));
        }

        function initLiveReports() {
            clearInterval(chartUpdateInterval);
            chart.data = [];
            hideContent($("#liveReportsPage"));
            $("#chartContainer").empty();
        }

        function onSearchBTNclicked() {
            //define search value
            let searchCoinVal = searchCoinInput.val();

            //init input
            searchCoinInput.val("");

            //init all boards, to able search from any area
            initAllBoardsOnUI();

            //validation
            if (!isSearchValueValid(searchCoinVal)) {
                //it's not a click but I need ALL these funcs to happen, so I will take advantage of this func.
                onShowHomepageClicked();
                return;
            }

            let searchValue = coinsCache.filter(val => val.symbol == searchCoinVal);

            showCoinsOnBoardUI(searchValue);
        }

        function initAllBoardsOnUI() {
            $("#liveReportsPage").hide();
            $("#aboutMePage").hide();
            coinBoard.empty();
        }

        function onShowLiveReportsClicked() {
            if (toggleState.length == 0) {
                alert("You must choose at least one coin to view the reports.\nPlease check the list again.");

                //it's not a click, but I need all the funcs in it to function
                onShowHomepageClicked();
            } else {
                activateNecessaryOnNavUI(liveReports, home, aboutMe);

                clearCoinBoard();
                hideContent($("#aboutMePage"));

                showContent($("#liveReportsPage"));

                const liveReportsUrl = "https://min-api.cryptocompare.com/data/pricemulti?fsyms=" + toggleState + "&tsyms=USD";

                createLiveReportsChart(liveReportsUrl);

                chartUpdateInterval = setInterval(function () {
                    UpdateLiveReportsChart(liveReportsUrl);
                }, 2000);
            }
        }

        function isSearchValueValid(searchCoinVal) {
            if (searchCoinVal.trim().length == 0) {
                alert("Please fill a coin to look for, or check the list");
                return false;
            }
            if (coinsCache.find(val => val.symbol == searchCoinVal) == undefined) {
                alert("We are sorry,\nthe coin you are looking for doesn't exist in our list.\nPlease check again");
                return false;
            }
            return true;
        }

        //  -----> NAV BUTTONS UI <-----

        //UPDATE BUTTONS STATUS - GATHERED FUNCTION
        // I choose which option will appear as active or not on the navbar, according to "page" changes
        //I should always have 1 element active and 2 elements disabled.
        function activateNecessaryOnNavUI(activeNavElement, disabledNavElementOne, disabledNavElementTwo) {
            activeOnNavUI(activeNavElement);
            disableOnNavUI(disabledNavElementOne);
            disableOnNavUI(disabledNavElementTwo);
        }

        //BUTTONS STATUS

        let activeOnNavUI = navElement => navElement.parent().addClass("active");
        let disableOnNavUI = navElement => navElement.parent().removeClass("active");

        //PAGES STATUS

        let hideContent = content => content.hide();
        let showContent = content => content.show();

        //  -----> PRELOADER <-----

        function createPreloader(currentCardBody, currentCoin) {
            let preloader = $("<img>")
            preloader.addClass("preloader");
            preloader.addClass(currentCoin);
            preloader.attr("src", "./image/preloader.gif");
            currentCardBody.append(preloader);
        }

        let hidePreloader = (currentCoin) => $(".preloader." + currentCoin).remove();

        //  -----> LIVE REPORTS <-----

        let chartUpdateInterval;

        let chart = {
            exportEnabled: true,
            animationEnabled: false,
            title: {
                text: "Live reports"
            },
            axisX: {
                valueFormatString: "HH:mm:ss",
            },
            axisY: {
                title: "Coin Value",
                suffix: "$",
                titleFontColor: "#4F81BC",
                lineColor: "#4F81BC",
                labelFontColor: "#4F81BC",
                tickColor: "#4F81BC",
                includeZero: true,
            },
            subtitles: [{
                text: "Click a coin to hide or unhide its Data Series"
            }],
            toolTip: {
                shared: true
            },
            legend: {
                cursor: "pointer",
                itemclick: toggleDataSeries
            },
            data: []
        }

        function toggleDataSeries(e) {
            if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                e.dataSeries.visible = false;
            } else {
                e.dataSeries.visible = true;
            }
            e.chart.render();
        }

        function createLiveReportsChart(liveReportsUrl) {
            let currencyListForChart = new Array();

            $.get(liveReportsUrl).then(
                function (currencies) {
                    console.log("getting currencies from server...")

                    currencies = Object.entries(currencies);
                    console.log(currencies);

                    for (let currency of currencies) {
                        let currencyForChart = {
                            type: "spline",
                            name: currency[0],
                            showInLegend: true,
                            xValueFormatString: "MMM YYYY",
                            yValueFormatString: "#,##0 Units",
                            dataPoints: [{ x: new Date(), y: currency[1].USD }]
                        }

                        currencyListForChart.push(currencyForChart);
                    }

                    //chart.data is an array in its origin.
                    //I push data to the chart object, according to the needed coins only
                    for (let index = 0; index < currencyListForChart.length; index++) {
                        chart.data.push(currencyListForChart[index]);
                    }

                    $("#chartContainer").CanvasJSChart(chart);
                })

                .catch(error => console.log(error));
        }

        function UpdateLiveReportsChart(liveReportsUrl) {
            $.get(liveReportsUrl).then(
                function (currencies) {
                    currencies = Object.entries(currencies);

                    let index = 0;

                    for (let currency of currencies) {
                        let newCurrencyRate = currency[1].USD;

                        chart.data[index].dataPoints.push({ x: new Date(), y: newCurrencyRate });

                        index++;
                    }
                    $("#chartContainer").CanvasJSChart(chart);
                })

                .catch(error => console.log(error));
        }

    });
})();