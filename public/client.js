$(document).ready(function(){
  /* Insert navbar */
  let navbar = `
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button>
      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">Navigation</a>
            <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
              <li><a class="dropdown-item" href="/intro">Intro & Scenario Control</a></li>
              <li><a class="dropdown-item" href="/governance">Governance</a></li>
              <li><a class="dropdown-item" href="/staff">Staff</a></li>
              <li><a class="dropdown-item" href="/data">Data</a></li>
              <li><a class="dropdown-item" href="/financials">Financials</a></li>
              <li><a class="dropdown-item" href="/strategy">Strategy</a></li>
              <li><a class="dropdown-item" href="/land_use">Land Use</a></li>
              <li><a class="dropdown-item" href="/energy_net">Energy Networks</a></li>
              <li><a class="dropdown-item" href="/waste_water">Waste & Water</a></li>
              <li><a class="dropdown-item" href="/transport">Transportation</a></li>
              <li><a class="dropdown-item" href="/buildings">Buildings</a></li>
              <li><a class="dropdown-item" href="/outputs">Outputs</a></li>
            </ul>
          </li>
        </ul>
      </div>
    </nav>`
  $("#navbar").append(navbar);

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
      /* Insert scenario info */
      $("#scenario").text("Current Scenario:  " + result.scen_name);
      $("#scen_carry").val(result.scen_name);

      /* Insert scenario data into form */
      let subResult = result[window.location.pathname.substring(1)];
      let halfSub = "";
      for (let key in subResult) {
        if (typeof(subResult[key]) === "string") { $("#" + key).val(subResult[key]) }  // Notes
        else if (typeof(subResult[key]) === "number") {
          $("#" + key).prop("checked", true).trigger("handleChange");  // Checkboxes
          $("#" + key + "_" + subResult[key]).prop("checked", true).trigger("handleChange");  // Radios general
          $("#" + key + "_half").prop("checked", true).trigger("handleChange");  //  0.5 pt on-off-sub radios (jQuery won't search for 0.5)
        };
      }

      /*  Add pot-na-true class to global not applicables */
      if (result.pop_size === "1000 - 9999" || result.pop_size === "<1000") { $(".pot-na-pop").addClass("pot-na-true").prop("checked", false).trigger("handleNa") };
      if (result.pop_growth === "stable/shrinking") { $(".pot-na-growth").addClass("pot-na-true").prop("checked", false).trigger("handleNa") };
      if (result.sig_murb_stock === "no") { $(".pot-na-murb").addClass("pot-na-true").prop("checked", false).trigger("handleNa") };
      if (result.sig_comm_stock === "no") { $(".pot-na-comm").addClass("pot-na-true").prop("checked", false).trigger("handleNa") };
      if (result.cent_water === "no") { $(".pot-na-water").addClass("pot-na-true").prop("checked", false).trigger("handleNa") };
      if (result.public_tran === "no") { $(".pot-na-transit").addClass("pot-na-true").prop("checked", false).trigger("handleNa") };
      if (result.gas_conx === "no") { $(".pot-na-gas").addClass("pot-na-true").prop("checked", false).trigger("handleNa") };
      if (result.waste_cont === "no") { $(".pot-na-waste").addClass("pot-na-true").prop("checked", false).trigger("handleNa") };
      if (result.prov_terr === "Yukon" || result.prov_terr === "Northwest Territories" || result.prov_terr === "Nunavut") { $(".pot-na-prov-north").addClass("pot-na-true").prop("checked", false).trigger("handleNa") };
      if (result.flood_prone === "no") { $(".pot-na-flood").addClass("pot-na-true").prop("checked", false).trigger("handleNa") };

      /* Check N/As where global applicables apply to entire row */
      $(".na.pot-na-true").prop("checked", true).trigger("handleNa");

      /* Change max points for 2.4.3 if pop between 10,000 and 100,000 */
      if (result.pop_size === "10000 - 29999" || result.pop_size === "30000 - 99999") { $("#trans_dem_mgmt_3_max").val("1") };
      
      /* Alert if global not applicables (from Intro) have changed results requiring a save */
      if (subResult) { if (subResult.z_app_pts_total.toString() != $("#z_app_pts_total").val() || subResult.z_na_pts_total.toString() != $("#z_na_pts_total").val() || subResult.z_sect_complete != $("#z_sect_complete").val()) { alert("Changes to the base scenario information in the Introduction have changed results here, requiring that you perform a Save.") } };
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
    /* General highligthing & disabling */
    if (this.checked && this.classList.contains("na")) {
      $(this).parents("tr").find(".app").prop("checked", false).prop("disabled", true).parents("td").css("background-color", "lightgrey");
    } else if (!this.checked && this.classList.contains("na")) {
      $(this).parents("tr").find(".app,.na").parents("td").css("background-color", "#ffffff");
      $(this).parents("tr").find(".app:not(.on-off-sub)").prop("disabled", false);
    } else if (this.checked && this.classList.contains("zero")) {
      $(this).parents("tr").find(".app:not(.zero)").prop("checked", false).prop("disabled", true).parents("td").css("background-color", "lightgrey");
    } else if (!this.checked && this.classList.contains("zero")) {
      $(this).parents("tr").find(".app").parents("td").css("background-color", "#ffffff");
      $(this).parents("tr").find(".app:not(.on-off-sub)").prop("disabled", false);      
    } else if (!this.checked && this.type === "checkbox" && !this.classList.contains("sub-check")) {
      $(this).parents("td").css("background-color", "#ffffff");
    } else if (this.type === "radio" && !this.classList.contains("on-off-sub")) {
      $(this).parents("tr").children("td").css("background-color", "#ffffff");
    };
    
    if (this.checked) {
      $(this).parents("td").css("background-color", "#ffcd05");
    };

    /* Handle local energy mapping & model not applicables */
    if (this.id === "energy_mapping_0" || this.id === "scenario_model_0") {
      if (this.checked) {
        $(this).parents("tr").find("input:eq(3),input:eq(4),input:eq(5)").addClass("pot-na-local-true").prop("checked", false).prop("disabled", true).parents("td").css("background-color", "lightgrey");
      } else if (!this.checked) {
        $(this).parents("tr").find("input:eq(3):not(.pot-na-true),input:eq(4):not(.pot-na-true),input:eq(5):not(.pot-na-true)").removeClass("pot-na-local-true").prop("disabled", false).parents("td").css("background-color", "#ffffff");
      };
    };

    /* Handle sub radio button on/off */
    if (this.classList.contains("on-off")) {
      if (this.checked) { $(this).siblings().children().prop("disabled", false) }
      else if (!this.checked) { $(this).siblings().children().prop("disabled", true).prop("checked", false) };
    };

    /* Handle sub checkbox maximums and de-highlighting */
    let arr = [], i = 0, sum = 0;
    if (this.classList.contains("sub-check")) {
      arr = $(this).parents("td").find(".sub-check:checked");
      for (i = 0; i < arr.length; i++) {
        if (arr[i].checked) { sum += Number(arr[i].value) };
      };
        if (sum > $(this).parents("td").find(".sub-check-max").val()) { this.checked = false }
        else if (sum === 0) { $(this).parents("td").css("background-color", "#ffffff") };
    };

    /* Handle infeasible options */
    if (this.classList.contains("infeas")) {
      if (this.checked) {
        $(this).parents("td").css("background-color", "lightgrey").find("input:first").addClass("pot-na-local-true").prop("checked", false).prop("disabled", true);
    } else if (!this.checked) {
        $(this).parents("td").css("background-color", "#ffffff").find("input:first").removeClass("pot-na-local-true").prop("disabled", false);
      };
    };

    /* Re-grey out unused table cells */
    $("td:empty").css("background-color", "lightgrey");

    /* Re-disable global and local not applicables */
    $(".pot-na-true,.pot-na-local-true").prop("disabled", true).parents("td").css("background-color", "lightgrey");

    /* Trigger handlePoints */
    $(this).trigger("handlePoints");
  });

  /* handleNa function (handles global (i.e. from Intro) not applicables only */
  $(".form-check-input").on("handleNa", function(event) {    
    /* Disable global not applicables */
    $(".pot-na-true").prop("disabled", true).parents("td").css("background-color", "lightgrey");

    /* Trigger handlePoints */
    $(this).trigger("handlePoints");
  });

  /* handlePoints function */
  $(".form-check-input").on("handlePoints", function(event) {    
    let arr = [], i = 0, sum = 0;

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
    arr = $(".na:not(:checked)").parents("tr").find(".pot-na-true:not(.sub-check),.pot-na-local-true:not(.sub-check)");
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
  });

});