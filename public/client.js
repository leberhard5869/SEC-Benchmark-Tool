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
  $('[data-bs-toggle="tooltip"]').tooltip();

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
      if (typeof(result) === "string") {
        $("#scenario").append(result);
      } else {
        $("#scenario").append(result.scen_name);
        $("#scen_carry").val(result.scen_name);

        /* Enable save button if scenario exists */
        if (result.scen_name) $("#form-submit").prop("disabled", false);

        /* Change max points for 2.4.3 if pop below 100,000 */
        if (result.pop_size === "<1000" || result.pop_size === "1000 - 9999" || result.pop_size === "10000 - 29999" || result.pop_size === "30000 - 99999") { $("#trans_dem_mgmt_3_max").val("1") };        

        /* Attach deficit data to all td elements that contain sub-checks */
        $(".sub-check").each(function() {
          $(this).parents("td").data("deficit", "0");
        });
        
        /* Insert scenario data into form */
        let subResult = result[window.location.pathname.substring(1)];

        for (let key in subResult) {
          if (typeof(subResult[key]) === "string") { $("#" + key).val(subResult[key]) }  // Notes
          else if (typeof(subResult[key]) === "number") {
            $("#" + key).prop("checked", true).trigger("handleChange");  // Checkboxes
            $("#" + key + "_" + subResult[key]).prop("checked", true).trigger("handleChange");  // Radios general
            if (subResult[key] === 0.5) { $("#" + key + "_half").prop("checked", true).trigger("handleChange") };  // 0.5 pt on-off-sub radios (jQuery won't search for 0.5)
            if (subResult[key] === 1.5) { $("#" + key + "_oneAndHalf").prop("checked", true).trigger("handleChange") }; //  1.5 pt on-off-sub radios (jQuery won't search for 1.5)
          };
        }

        /*  Add pot-na-true class to checked global not applicables */
        if (result.pop_size === "1000 - 9999" || result.pop_size === "<1000") {
          $(".pot-na-pop").data("pot-na", "true").parents("td").css("background-color", "lightgrey");
          $(".pot-na-pop.app:not(.zero)").addClass("pot-na-true").trigger("handleClass");
        };
        if (result.pop_growth === "stable/shrinking") {
          $(".pot-na-growth").data("pot-na", "true").parents("td").css("background-color", "lightgrey");
          $(".pot-na-growth.app:not(.zero)").addClass("pot-na-true").trigger("handleClass");
        };
        if (result.sig_murb_stock === "no") {
          $(".pot-na-murb").data("pot-na", "true").parents("td").css("background-color", "lightgrey");
          $(".pot-na-murb.app:not(.zero)").addClass("pot-na-true").trigger("handleClass");
        };
        if (result.sig_comm_stock === "no") {
          $(".pot-na-comm").data("pot-na", "true").parents("td").css("background-color", "lightgrey");
          $(".pot-na-comm.app:not(.zero)").addClass("pot-na-true").trigger("handleClass");
        };
        if (result.cent_water === "no") {
          $(".pot-na-water").data("pot-na", "true").parents("td").css("background-color", "lightgrey");
          $(".pot-na-water.app:not(.zero)").addClass("pot-na-true").trigger("handleClass");
        };
        if (result.public_tran === "no") {
          $(".pot-na-transit").data("pot-na", "true").parents("td").css("background-color", "lightgrey");
          $(".pot-na-transit.app:not(.zero)").addClass("pot-na-true").trigger("handleClass");
        };
        if (result.gas_conx === "no") {
          $(".pot-na-gas").data("pot-na", "true").parents("td").css("background-color", "lightgrey");
          $(".pot-na-gas.app:not(.zero)").addClass("pot-na-true").trigger("handleClass");
        };
        if (result.waste_cont === "no") {
          $(".pot-na-waste").data("pot-na", "true").parents("td").css("background-color", "lightgrey");
          $(".pot-na-waste.app:not(.zero)").addClass("pot-na-true").trigger("handleClass");
        };
        if (result.prov_terr === "Yukon" || result.prov_terr === "Northwest Territories" || result.prov_terr === "Nunavut") {
          $(".pot-na-north").data("pot-na", "true").parents("td").css("background-color", "lightgrey");
          $(".pot-na-north.app:not(.zero)").addClass("pot-na-true").trigger("handleClass");
        };
        if (result.flood_prone === "no") {
          $(".pot-na-flood").data("pot-na", "true").parents("td").css("background-color", "lightgrey");
          $(".pot-na-flood.app:not(.zero)").addClass("pot-na-true").trigger("handleClass");
        };
        if (result.pub_sect_orgs === "no") {
          $(".pot-na-public").data("pot-na", "true").parents("td").css("background-color", "lightgrey");
          $(".pot-na-public.app:not(.zero)").addClass("pot-na-true").trigger("handleClass");
        };
        if (result.priv_sect_oper === "no") {
          $(".pot-na-private").data("pot-na", "true").parents("td").css("background-color", "lightgrey");
          $(".pot-na-private.app:not(.zero)").addClass("pot-na-true").trigger("handleClass");
        };

        /* Check N/As where global applicables apply to entire row */
        $(".na").each(function() {
          if ($(this).data("pot-na") === "true" && $(this).parents("tr").find(".row-points").val() === "0") {
            $(this).parents("tr").find(".app").prop("checked", false).prop("disabled", true);
            $(this).prop("checked", true).trigger("handlePoints");
          };
        });

        /* Alert if global not applicables (from Intro) have changed results requiring a save */
        if (subResult) { if (subResult.z_app_pts_total.toString() != $("#z_app_pts_total").val() || subResult.z_na_pts_total.toString() != $("#z_na_pts_total").val() || subResult.z_sect_complete != $("#z_sect_complete").val()) { alert("Changes to the base scenario information in the Introduction have changed results here, requiring that you perform a Save.") } };
      };
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
      $(this).parents("tr").find(".app:not(.zero)").prop("checked", false).prop("disabled", true);
    } else if (!this.checked && this.classList.contains("zero")) {
      $(this).parents("tr").find(".app:not(.on-off-sub)").prop("disabled", false);      
    } else if (!this.checked && this.type === "checkbox" && !this.classList.contains("sub-check")) {
      $(this).parents("td").css("background-color", "#ffffff");
    } else if (this.type === "radio" && !this.classList.contains("on-off-sub")) {
      $(this).parents("tr").children("td").css("background-color", "#ffffff");
    };

    /* Handle sub radio button on/off */
    if (this.classList.contains("on-off")) {
      if (this.checked) { $(this).siblings().children().prop("disabled", false) }
      else if (!this.checked) { $(this).siblings().children().prop("disabled", true).prop("checked", false) };
    };

    /* Handle sub checkbox maximums */    
    if (this.classList.contains("sub-check") || this.classList.contains("on-off")) {
      let sum = 0, def = 0;

      $(this).parents("td").find(".sub-check:checked").each(function() {
        sum += Number($(this).val());
      });
      if (sum > 0) { $(this).parents("td").find(".sub-check-max").prop("checked", true) };
      if (sum >= $(this).parents("td").find(".sub-check-max").val()) {
        def = Number($(this).parents("td").find(".sub-check-max").val()) - sum;
      };
      $(this).parents("td").data("deficit", def);
      if (sum === 0) {
        $(this).parents("td").css("background-color", "#ffffff");
        $(this).parents("td").find(".sub-check-max").prop("checked", false)
      };
    };

    /* Handle infeasible options */
    if (this.classList.contains("infeas")) {
      if (this.checked) {
        $(this).parents("td").css("background-color", "lightgrey").find("input:first").addClass("pot-na-local-true").prop("checked", false).prop("disabled", true);
      } else if (!this.checked) {
        $(this).parents("td").css("background-color", "#ffffff").find("input:first").removeClass("pot-na-local-true").prop("disabled", false);
      };
    };

    /* Trigger handleClass function */
    $(this).trigger("handleClass");
  });

  /* handleClass function */
  $(".form-check-input").on("handleClass", function(event) {    

    /* Add or remove pot-na-true class */
    $(".app:not(.zero,.sub-check,.on-off-sub,.infeas)").each(function() {
      if ($(this).data("pot-na") === "true") {
        if (this.checked) {
          $(this).parents("td").find(".app").removeClass("pot-na-true");
        } else if (!this.checked) {
          $(this).parents("td").find(".app").addClass("pot-na-true");
        };
      };
    });

    /* Make checked items yellow */
    if (this.checked) {
      $(this).parents("td").css("background-color", "#ffcd05");
    };

    /* Re-grey out global and local not applicables */
    $("input").each(function() {
      if ($(this).data("pot-na") === "true") { $(this).parents("td").css("background-color", "lightgrey") }
    });
    $(".pot-na-true,.pot-na-local-true").parents("td").css("background-color", "lightgrey");

    /* Re-grey out unused table cells */
    $("td:empty").css("background-color", "lightgrey");

    /* Trigger handlePoints function */
    $(this).trigger("handlePoints");
  });

  /* handlePoints function */
  $(".form-check-input").on("handlePoints", function(event) {    
    let sum = 0, defSum = 0;

    /* Row applicable points addition */
    $(this).parents("tr").find(".app:not(.sub-check-max").each(function() {
      if (this.checked) { sum += Number(this.value) };
    });
    $(this).parents("tr").find(".sub-check").parents("td").each(function() {
      defSum += Number($(this).data("deficit"));
    });
    sum += defSum;
    $(this).parents("tr").find(".row-points").val(sum);
    sum = sum.toString() + " points";
    $(this).parents("tr").find("output").html(sum);

    /* Total applicable points addition */
    sum = 0;
    $(".row-points").each(function() {
      sum += Number(this.value);
    });
    $("#z_app_pts_total").val(sum);

    /* Total not applicable points addition */
    sum = 0;
    $(".na:checked").each(function() {
      sum += Number(this.value);
    });
    $(".na:not(:checked)").parents("tr").find(".pot-na-true:not(.sub-check),.pot-na-local-true").each(function() {
      if (this.type === "checkbox") { sum += Number(this.value) }
      else if (this.type === "radio" && this.value != "0") { sum++ };
    });
    $("#z_na_pts_total").val(sum);

    /* Determination of complete form */
    sum = 0;
    $(this).parents("tr").find(".form-check-input").each(function() {
      if (this.checked) { sum++ };
    });
    sum > 0 ? $(this).parents("tr").find(".row-complete").val("true") : $(this).parents("tr").find(".row-complete").val("false");
    $("#z_sect_complete").val("true");
    $(".row-complete").each(function() {
      if (this.value === "false") { $("#z_sect_complete").val("false") };
    });
  });

});