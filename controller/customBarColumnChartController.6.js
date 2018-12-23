mod.controller('customBarColumnChartController', [
    '$scope',
    ($scope) => {
        // Sets default values for Design menu or gets values from widget.custom
        const { widget } = $scope;
        $scope.customMenuEnabled = $$get(widget, 'custom.barcolumnchart.customMenuEnabled') || false;
        $scope.addTotalOption = $$get(widget, 'custom.barcolumnchart.addTotalOption') || 'No';
        $scope.sortCategoriesOption = $$get(widget, 'custom.barcolumnchart.sortCategoriesOption') || 'Default';
        $scope.sortBreakByOption = $$get(widget, 'custom.barcolumnchart.sortBreakByOption') || 'Default';
        $scope.customBreakbyConfiguration = $$get(widget, 'custom.barcolumnchart.customBreakbyConfiguration') || [];
        $scope.customCategoryConfiguration = $$get(widget, 'custom.barcolumnchart.customCategoryConfiguration') || [];

        // Total point customizations
        $scope.totalPointColor = $$get(widget, 'custom.barcolumnchart.totalPointColor') || 'black';
        $scope.totalPointFontSize = $$get(widget, 'custom.barcolumnchart.totalPointFontSize') || '11px';
        $scope.totalPointSize = $$get(widget, 'custom.barcolumnchart.totalPointSize') || '5';
        $scope.totalPointFontFamily = $$get(widget, 'custom.barcolumnchart.totalPointFontFamily')
            || '"Lucida Grande", "Lucida Sans Unicode", Arial, Helvetica, sans-serif';
        $scope.totalAsLine = $$get(widget, 'custom.barcolumnchart.totalAsLine') || false;
        $scope.totalYAxisPercentSpacing = $$get(widget, 'custom.barcolumnchart.totalYAxisPercentSpacing') || 6;

        let defaultLabelPadding;
        if (widget.subtype === 'bar/classic' || widget.subtype === 'column/stackedcolumn') {
            defaultLabelPadding = 6;
        } else if (widget.subtype === 'column/classic') {
            defaultLabelPadding = 3;
        } else {
            defaultLabelPadding = undefined;
        }
        $scope.totalLabelPadding = $$get(widget, 'custom.barcolumnchart.totalLabelPadding') || defaultLabelPadding;

        const customModal = $('#custom-modal-overlay');
        const customModalHeaderTitle = $('#custom-modal-header-title');
        const customCategoryBtn = $('#customCategoryButton');
        const customBreakbyBtn = $('#customBreakbyButton');
        const customModalBodyList = $('#custom-modal-body-list');
        const customResetButton = $('#resetButton');
        const customSaveButton = $('#saveButton');
        const customCancelButton = $('#cancelButton');
        let dragSrcEl = null;
        let lastModalOpened = null;
        const defaultTotalSortValue = 'zzzzzzTotal';
        let listItems = null;


        // -------------------------------------------------------------------------------------------------------------
        // Functions used for drag and dropping elements within the modal popup
        const findLargerModalItemIndex = (elem1, elem2) => {
            let index1 = -1;
            let index2 = 0;
            elem1.parentNode.childNodes.forEach((elem, index) => {
                if (elem1.textContent === elem.textContent) {
                    index1 = index;
                }
                if (elem2.textContent === elem.textContent) {
                    index2 = index;
                }
            });
            return index1 > index2;
        };

        const handleDragStart = (elem) => {
            elem.target.style.opacity = '0.4';
            dragSrcEl = elem.target;
            elem.dataTransfer.effectAllowed = 'move';
            elem.dataTransfer.setData('text/html', elem.target.innerHTML);
        };

        const handleDragOver = (elem) => {
            if (elem.preventDefault) {
                elem.preventDefault(); // Necessary. Allows us to drop.
            }
            elem.dataTransfer.dropEffect = 'move'; // See the section on the DataTransfer object.
            return false;
        };

        const handleDragEnter = (elem) => {
            elem.target.classList.add('active');
            const index1 = listItems.indexOf(dragSrcEl.textContent);
            const index2 = listItems.indexOf(elem.target.textContent);
            if (index1 !== index2) {
                listItems.splice(index1, 1);
                listItems.splice(index2, 0, dragSrcEl.textContent);
            }

            if (lastModalOpened === 'Category') {
                $$set(widget, 'custom.barcolumnchart.tempCategoryConfiguration', listItems);
            } else {
                $$set(widget, 'custom.barcolumnchart.tempBreakbyConfiguration', listItems);
            }
            $scope.widget.redraw();
        };

        const handleDragLeave = (elem) => {
            elem.target.classList.remove('active');
        };

        const handleDragEnd = () => {
            const cols = document.querySelectorAll('.custom-modal-body-list-item');
            [].forEach.call(cols, (col) => {
                col.classList.remove('active');
                col.style.opacity = '1';
            });
        };

        const addDnDHandlers = (elem) => {
            elem.addEventListener('dragstart', handleDragStart, false);
            elem.addEventListener('dragenter', handleDragEnter, false);
            elem.addEventListener('dragover', handleDragOver, false);
            elem.addEventListener('dragleave', handleDragLeave, false);
            // eslint-disable-next-line no-use-before-define
            elem.addEventListener('drop', handleDrop, false);
            elem.addEventListener('dragend', handleDragEnd, false);
        };

        const handleDrop = (elem) => {
            if (elem.stopPropagation) {
                elem.stopPropagation(); // Stops some browsers from redirecting.
            }
            if (dragSrcEl !== elem.target) { // Don't do anything if dropping the same column we're dragging.
                // Need to figure out if element is above or below other element.
                const placeItemBefore = findLargerModalItemIndex(dragSrcEl, elem.target);
                elem.target.parentNode.removeChild(dragSrcEl);
                const item = $("<li class='custom-modal-body-list-item' draggable='true'></li>")
                    .text(dragSrcEl.textContent);
                addDnDHandlers(item[0]);
                if (placeItemBefore) {
                    $(elem.target).before(item[0]);
                } else {
                    $(elem.target).after(item[0]);
                }

                if (lastModalOpened === 'Category') {
                    $$set(widget, 'custom.barcolumnchart.tempCategoryConfiguration', listItems);
                } else {
                    $$set(widget, 'custom.barcolumnchart.tempBreakbyConfiguration', listItems);
                }
                $scope.widget.redraw();
            }
            return false;
        };


        // ----------------------------------Returns the Categories of the widget---------------------------------------
        const getCategoryNames = () => {
            const categoryNames = [];
            const { categories } = $scope.widget.queryResult.xAxis;
            const { series } = $scope.widget.queryResult;
            for (let a = 0; a < categories.length; a++) {
                for (let b = 0; b < series.length; b++) {
                    try {
                        if (series[b].data[a].selectionData !== undefined
                            && series[b].data[a].selectionData[0] !== undefined) {
                            if (series[b].data[a].selectionData[0] instanceof Date) {
                                categoryNames.push(series[b].data[a].selectionData[0].toISOString());
                            } else {
                                categoryNames.push(series[b].data[a].selectionData[0].toString());
                            }
                            break;
                        }
                    } catch (err) {
                        // Do Nothing
                    }
                }
            }
            return categoryNames;
        };


        // -----------------------------------Returns the BreakBy of the widget-----------------------------------------
        const getBreakbyNames = () => {
            const { series } = $scope.widget.queryResult;
            const seriesNames = []; // Gets current order of the BreakBy
            for (let i = 0; i < series.length; i++) {
                if (series[i].sortData instanceof Date) {
                    seriesNames.push(series[i].sortData.toISOString());
                } else if (series[i].sortData !== undefined
                    && !Number.isNaN(series[i].sortData)
                    && !series[i].sortData.includes(defaultTotalSortValue)) {
                    // If series is a Date Field, then store values in ISO
                    const match1 = series[i].sortData
                        .match('[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}'); // 2018-12-19T00:00:00
                    const match2 = series[i].sortData
                        .match('[A-Za-z]{3} [0-9]{2} [0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2}'); // Dec 19 2018 00:00:00

                    if (match1 !== null) { // Date is already in ISO format
                        seriesNames.push(series[i].sortData.substring(match1.index));
                    } else if (match2 !== null) { // Date needs to be converted to ISO Format
                        const matchRes = series[i].sortData
                            .substring(match2.index).substring(0, 20);
                        let strMonthNum;
                        switch (matchRes.substring(0, 3)) {
                            case 'Jan':
                                strMonthNum = '01';
                                break;
                            case 'Feb':
                                strMonthNum = '02';
                                break;
                            case 'Mar':
                                strMonthNum = '03';
                                break;
                            case 'Apr':
                                strMonthNum = '04';
                                break;
                            case 'May':
                                strMonthNum = '05';
                                break;
                            case 'Jun':
                                strMonthNum = '06';
                                break;
                            case 'Jul':
                                strMonthNum = '07';
                                break;
                            case 'Aug':
                                strMonthNum = '08';
                                break;
                            case 'Sep':
                                strMonthNum = '09';
                                break;
                            case 'Oct':
                                strMonthNum = '10';
                                break;
                            case 'Nov':
                                strMonthNum = '11';
                                break;
                            case 'Dec':
                                strMonthNum = '12';
                                break;
                            default:
                                strMonthNum = '00';
                                break;
                        }
                        seriesNames.push(`${matchRes.substring(7, 11)}-${strMonthNum}-${matchRes.substring(4, 6)}`
                            + `T${matchRes.substring(12)}`);
                    } else { // Non-Date Field
                        seriesNames.push(series[i].name);
                    }
                } else if (series[i].name !== 'Total') { // No sort data populated
                    seriesNames.push(series[i].name);
                }
            }
            return seriesNames;
        };


        // ------------------------------Saves the Custom Category/Breakby Settings-------------------------------------
        const saveCustomSort = () => {
            $(customModal).css('display', 'none');
            $('.trillapser-container').css('display', 'block');
            if (lastModalOpened === 'Category') {
                $scope.customCategoryConfiguration = listItems;
                $$set(widget, 'custom.barcolumnchart.customCategoryConfiguration', $scope.customCategoryConfiguration);
                $$set(widget, 'custom.barcolumnchart.tempCategoryConfiguration', undefined);
            } else if (lastModalOpened === 'BreakBy') {
                $scope.customBreakbyConfiguration = listItems;
                $$set(widget, 'custom.barcolumnchart.customBreakbyConfiguration', $scope.customBreakbyConfiguration);
                $$set(widget, 'custom.barcolumnchart.tempBreakbyConfiguration', undefined);
            }
            listItems = null;
            $scope.widget.redraw();
        };


        // ------------------------------Modal Popup is closed by clicking off the side---------------------------------
        window.onclick = (event) => { // When the user clicks anywhere outside of the modal, close it
            if (event.target === customModal[0]) {
                saveCustomSort();
            }
        };


        // -------------------------------------Save Config Button Clicked----------------------------------------------
        customSaveButton.click(() => {
            saveCustomSort();
        });


        // ---------------------------------------Cancel Button Clicked-------------------------------------------------
        customCancelButton.click(() => {
            $(customModal).css('display', 'none');
            $('.trillapser-container').css('display', 'block');
            $$set(widget, 'custom.barcolumnchart.tempCategoryConfiguration', undefined);
            $$set(widget, 'custom.barcolumnchart.tempBreakbyConfiguration', undefined);
            listItems = null;
            $scope.widget.redraw();
        });


        // ------------------------------------------Reset Modal Popup--------------------------------------------------
        const resetModalPopup = (popupList) => {
            customModalBodyList.empty(); // Clear out configuration page, and redisplay current configuration
            popupList.forEach((value) => {
                const item = $("<li class='custom-modal-body-list-item' draggable='true'></li>")
                    .text(value);
                customModalBodyList.append(item);
            });
            const cols = document.querySelectorAll('.custom-modal-body-list-item');
            [].forEach.call(cols, addDnDHandlers);
            listItems = popupList;
        };

        // -----------------------------------------Reset Button Clicked------------------------------------------------
        customResetButton.click(() => {
            if (lastModalOpened === 'Category') {
                resetModalPopup(getCategoryNames().sort());
                $$set(widget, 'custom.barcolumnchart.tempCategoryConfiguration', listItems);
            } else if (lastModalOpened === 'BreakBy') {
                resetModalPopup(getBreakbyNames().sort());
                $$set(widget, 'custom.barcolumnchart.tempBreakbyConfiguration', listItems);
            }
            $scope.widget.redraw();
        });


        // --------------------------------------Custom Category Button Clicked-----------------------------------------
        customCategoryBtn.click(() => {
            lastModalOpened = 'Category';
            $(customModal).css('display', 'block');
            $('.trillapser-container').css('display', 'none');
            $(customModalHeaderTitle).text('Custom Category');
            const categoryNames = getCategoryNames();

            // If first time clicking the button, then no configuration has been specified.
            // Default to the current order of the breakby.
            if ($scope.customCategoryConfiguration === undefined || $scope.customCategoryConfiguration.length === 0) {
                $scope.customCategoryConfiguration = categoryNames;
                $$set(widget, 'custom.barcolumnchart.customCategoryConfiguration', $scope.customCategoryConfiguration);
            } else { // If there are new values in the category, then add them to the end of the configuration
                categoryNames.forEach((categoryName) => {
                    if (!$scope.customCategoryConfiguration.includes(categoryName)) {
                        $scope.customCategoryConfiguration.push(categoryName);
                    }
                });
                $$set(widget, 'custom.barcolumnchart.customCategoryConfiguration', $scope.customCategoryConfiguration);
            }

            resetModalPopup($scope.customCategoryConfiguration);
            $$set(widget, 'custom.barcolumnchart.tempCategoryConfiguration', listItems);
            $scope.widget.redraw();
        });


        // -----------------------------------Custom BreakBy Button Clicked---------------------------------------------
        customBreakbyBtn.click(() => {
            lastModalOpened = 'BreakBy';
            $(customModal).css('display', 'block');
            $('.trillapser-container').css('display', 'none');
            $(customModalHeaderTitle).text('Custom Break By');
            const breakbyNames = getBreakbyNames();

            // If first time clicking the button, then no configuration has been specified.
            // Default to the current order of the breakby.
            if ($scope.customBreakbyConfiguration === undefined || $scope.customBreakbyConfiguration.length === 0) {
                $scope.customBreakbyConfiguration = breakbyNames;
                $$set(widget, 'custom.barcolumnchart.customBreakbyConfiguration', $scope.customBreakbyConfiguration);
            } else { // If there are new values in the breakby, then add them to the end of the configuration
                breakbyNames.forEach((breakbyName) => {
                    if (!$scope.customBreakbyConfiguration.includes(breakbyName)) {
                        $scope.customBreakbyConfiguration.push(breakbyName);
                    }
                });
                $$set(widget, 'custom.barcolumnchart.customBreakbyConfiguration', $scope.customBreakbyConfiguration);
            }

            resetModalPopup($scope.customBreakbyConfiguration);
            $$set(widget, 'custom.barcolumnchart.tempBreakbyConfiguration', listItems);
            $scope.widget.redraw();
        });


        // -----------------------------------Watch when the widget type changes----------------------------------------
        $scope.$watch('widget', () => {
            $scope.type = $$get($scope, 'widget.type');
            $$set(widget, 'custom.barcolumnchart.type', $scope.type);
            $scope.isTypeValid = $scope.type === 'chart/bar' || $scope.type === 'chart/column';
            $$set(widget, 'custom.barcolumnchart.isTypeValid', $scope.isTypeValid);
        });


        // ---------------------------------Triggers on customMenuEnabled changed---------------------------------------
        $scope.enabledChanged = () => {
            $scope.customMenuEnabled = !$scope.customMenuEnabled;
            $$set(widget, 'custom.barcolumnchart.customMenuEnabled', $scope.customMenuEnabled);
            $scope.widget.redraw();
        };


        // -----------------------------Triggers on showTotals radio selection changed----------------------------------
        $scope.changeAddTotal = (addTotal) => {
            $$set(widget, 'custom.barcolumnchart.addTotalOption', addTotal);
            $scope.addTotalOption = addTotal;
            $scope.widget.redraw();
        };


        // ----------------------------Triggers on sortCategories radio selection changed-------------------------------
        $scope.changeSortCategories = (sortCategories) => {
            $$set(widget, 'custom.barcolumnchart.sortCategoriesOption', sortCategories);
            $scope.sortCategoriesOption = sortCategories;
            $scope.widget.redraw();
        };


        // -------------------------------Triggers on sortBreakBy radio selection changed-------------------------------
        $scope.changeSortBreakBy = (sortBreakBy) => {
            $$set(widget, 'custom.barcolumnchart.sortBreakByOption', sortBreakBy);
            $scope.sortBreakByOption = sortBreakBy;
            $scope.widget.redraw();
        };
    },
]);
