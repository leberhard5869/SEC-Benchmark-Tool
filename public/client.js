$(document).ready(function(){
  /* Enable info circle hover document-wide */
  $('[data-toggle="tooltip"]').tooltip();

  /* Grey out unused table cells */
  $("td:empty").css("background-color", "lightgrey");

  /* Grey out & disable rows that are checked N/A, checklist background highligthing & row point addition for remainder */
  $(".form-check-input").change(function() {
    $(this).trigger("handleChange");
  });

  /* Load scenario data (if any) */
  $.ajax({
    type: "GET",
    url: "/db/data",
    success: function(result) {
      $("#scenario").text("Current Scenario:  " + result.scen_name);
      $("#scen_carry").val(result.scen_name);

      /* Grey out global not applicables and add pot-na-true class */
      if (result.pop_size === "1000 - 9999" || result.pop_size === "<1000") {
        $(".pot-na-pop").addClass("pot-na-true").prop("checked", false).prop("disabled", true).parents("td").css("background-color", "lightgrey");
      };
      if (result.pop_growth === "stable/shrinking") {
        $(".pot-na-growth").addClass("pot-na-true").prop("checked", false).prop("disabled", true).parents("td").css("background-color", "lightgrey");
      };
      if (result.sig_murb_stock === "no") {
        $(".pot-na-murb").addClass("pot-na-true").prop("checked", false).prop("disabled", true).parents("td").css("background-color", "lightgrey");
      };
      if (result.sig_comm_stock === "no") {
        $(".pot-na-comm").addClass("pot-na-true").prop("checked", false).prop("disabled", true).parents("td").css("background-color", "lightgrey");
      };
      if (result.cent_water === "no") {
        $(".pot-na-water").addClass("pot-na-true").prop("checked", false).prop("disabled", true).parents("td").css("background-color", "lightgrey");
      };
      if (result.public_tran === "no") {
        $(".pot-na-transit").addClass("pot-na-true").prop("checked", false).prop("disabled", true).parents("td").css("background-color", "lightgrey");
      };
      if (result.gas_conx === "no") {
        $(".pot-na-gas").addClass("pot-na-true").prop("checked", false).prop("disabled", true).parents("td").css("background-color", "lightgrey");
      };
            
      /* Insert scenario data into form */
      let subResult = result[window.location.pathname.substring(1)];
      for (let key in subResult) {
        if (typeof(subResult[key]) === "string") { $("#" + key).val(subResult[key]) }
        else if (typeof(subResult[key]) === "number") {
          $("#" + key).prop("checked", true).trigger("handleChange");
          $("#" + key + "_" + subResult[key]).prop("checked", true).trigger("handleChange");
        };
      }
    }
  });
  
  /* Save scenario data */
  $("#form-data").on("submit", function(e) {
    $.ajax({
      type: "POST",
      url: "/db/data" + window.location.pathname,
      data: $(this).serialize(),
      success: function(result) {
        alert(result);
      }
    });
    e.preventDefault();
  });

  /* handleChange function */
  $(".form-check-input").on("handleChange", function(event) {
    let arr = [], i = 0, sum = 0;

    /* Highligthing & disabling */
    if (this.checked && this.classList.contains('na')) {
      $(this).parents("tr").children("td").css("background-color", "lightgrey");
      $(this).parents("tr").find("input:gt(0)").prop("checked", false);
      $(this).parents("tr").find("input:gt(0)").prop("disabled", true);
    } else if (!this.checked && this.classList.contains('na')) {
      $(this).parents("tr").children("td").css("background-color", "#ffffff");
      $(this).parents("tr").find("input:gt(0)").prop("disabled", false);
    } else if (!this.checked && this.type === "checkbox") {
      $(this).parents("td").css("background-color", "#ffffff");
    } else if (this.type === "radio") {
      $(this).parents("tr").children("td").css("background-color", "#ffffff");
    };
    if (this.checked) {
      $(this).parents("td").css("background-color", "#ffcd05");
    };
    
    /* Re grey-out global not applicables */
    $(".pot-na-true").prop("checked", false).prop("disabled", true).parents("td").css("background-color", "lightgrey");

    /* Row applicable points addition */
    arr = $(this).parents("tr").find(".app");
    for (i = 0; i < arr.length; i++) {
      if (arr[i].checked) { sum += Number(arr[i].value) };
    };
    $(this).parents("tr").find(".row-points").val(sum);
    sum = sum.toString() + " points";
    $(this).parents("tr").find("output").html(sum);

    /* Total applicable points addition */
    sum = 0;
    arr = $(".row-points");
    for (i = 0; i < arr.length; i++) {
      sum += Number(arr[i].value);
    };
    $("#z_app_pts_total").val(sum);

    /* Total not applicable points addition */
    sum = 0;
    arr = $(".na:checked");
    for (i = 0; i < arr.length; i++) { sum += Number(arr[i].value) };
    arr = $(".na:not(:checked)").parents("tr").find(".pot-na-true,.pot-na-local-true");
    for (i = 0; i < arr.length; i++) {
      if (arr[i].type === "checkbox") { sum += Number(arr[i].value) }
      else if (arr[i].type === "radio") { sum++ };
    };
    $("#z_na_pts_total").val(sum);

    /* Determination of complete form */
    sum = 0;
    arr = $(this).parents("tr").find(".form-check-input");
    for (i = 0; i < arr.length; i++) {
      if (arr[i].checked) { sum++ };
    };
    sum > 0 ? $(this).parents("tr").find(".row-complete").val("true") : $(this).parents("tr").find(".row-complete").val("false");
    arr = $(".row-complete");
    $("#z_sect_complete").val("true");
    for (i = 0; i < arr.length; i++) {
      if (arr[i].value === "false") { $("#z_sect_complete").val("false") };
    };

    /* Re-grey out unused table cells */
    $("td:empty").css("background-color", "lightgrey");

  });

});