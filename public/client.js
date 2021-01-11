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

      /* Insert scenario data into form */
      let subResult = result[window.location.pathname.substring(1)];
      for (let key in subResult) {
        if (typeof(subResult[key]) === "string") { $("#" + key).val(subResult[key]) }
        else if (typeof(subResult[key]) === "number") {
          $("#" + key).prop("checked", true).trigger("handleChange");
          $("#" + key + "_" + subResult[key]).prop("checked", true).trigger("handleChange");
        };
      }

      /*  Add pot-na-true class to global not applicables */
      if (result.pop_size === "1000 - 9999" || result.pop_size === "<1000") { $(".pot-na-pop").addClass("pot-na-true").prop("checked", false).trigger("handleChange") };
      if (result.pop_growth === "stable/shrinking") { $(".pot-na-growth").addClass("pot-na-true").prop("checked", false).trigger("handleChange") };
      if (result.sig_murb_stock === "no") { $(".pot-na-murb").addClass("pot-na-true").prop("checked", false).trigger("handleChange") };
      if (result.sig_comm_stock === "no") { $(".pot-na-comm").addClass("pot-na-true").prop("checked", false).trigger("handleChange") };
      if (result.cent_water === "no") { $(".pot-na-water").addClass("pot-na-true").prop("checked", false).trigger("handleChange") };
      if (result.public_tran === "no") { $(".pot-na-transit").addClass("pot-na-true").prop("checked", false).trigger("handleChange") };
      if (result.gas_conx === "no") { $(".pot-na-gas").addClass("pot-na-true").prop("checked", false).trigger("handleChange") };

      /* Check N/As where global applicables apply to entire row */
      $(".na.pot-na-true").prop("checked", true).trigger("handleChange");

      /* Alert if global not applicables (from Intro) have changed results requiring a save */
      if (subResult.z_app_pts_total.toString() != $("#z_app_pts_total").val() || subResult.z_na_pts_total.toString() != $("#z_na_pts_total").val() || subResult.z_sect_complete != $("#z_sect_complete").val()) { alert("Changes to the base scenario information in the Introduction have changed results here, requiring that you perform a Save.") };
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
    if (this.checked && this.classList.contains("na")) {
      $(this).parents("tr").find(".app").parents("td").css("background-color", "lightgrey");
      $(this).parents("tr").find(".app").prop("checked", false);
      $(this).parents("tr").find(".app").prop("disabled", true);
    } else if (!this.checked && this.classList.contains('na')) {
      $(this).parents("tr").find(".app,.na").parents("td").css("background-color", "#ffffff");
      $(this).parents("tr").find(".app").prop("disabled", false);
    } else if (!this.checked && this.type === "checkbox") {
      $(this).parents("td").css("background-color", "#ffffff");
    } else if (this.type === "radio") {
      $(this).parents("tr").children("td").css("background-color", "#ffffff");
    };
    if (this.checked) {
      $(this).parents("td").css("background-color", "#ffcd05");
    };
    
    /* Disable global not applicables */
    $(".pot-na-true").prop("disabled", true).parents("td").css("background-color", "lightgrey");
    
    /* Handle local energy mapping & model not applicables */
    if (this.id === "energy_mapping_0" || this.id === "scenario_model_0") {
      if (this.checked) {
        $(this).parents("tr").find("input:eq(3), input:eq(4), input:eq(5)").addClass("pot-na-local-true").prop("checked", false).prop("disabled", true).parents("td").css("background-color", "lightgrey");
      } else if (!this.checked) {
        $(this).parents("tr").find("input:eq(3):not(.pot-na-true), input:eq(4):not(.pot-na-true), input:eq(5):not(.pot-na-true)").removeClass("pot-na-local-true").prop("disabled", false).parents("td").css("background-color", "#ffffff");
      };
    };

    /* Handle local radio button on/off */
    if (this.id === "retro_exist_single_2_on" || this.id === "retro_exist_murb_2_on" || this.id === "retro_exist_comm_2_on" ) {
      if (this.checked) { $(this).siblings().children().prop("disabled", false) }
      else if (!this.checked) { $(this).siblings().children().prop("disabled", true).prop("checked", false) };
    };

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