const passport = require('passport');
const bcrypt = require('bcrypt');

module.exports = function(app, myDataBase) {

  app.route('/')
    .get((req, res) => {
      res.sendFile(process.cwd() + '/views/index.html');
    });

  app.route('/login')
    .post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
      res.redirect('/intro');
    });

  app.route('/register')
    .post(
      (req, res, next) => {
        const hash = bcrypt.hashSync(req.body.password, 12);
        myDataBase.findOne({ username: req.body.username }, function(err, user) {
          if (err) {
            next(err);
          } else if (user) {
        //    alert('User already exists.');
            res.redirect('/');
          } else {
            myDataBase.insertOne({
              username: req.body.username,
              password: hash,
              currentScen: null,
              scenarios: []
            },
            (err, doc) => {
              if (err) {
        //        alert('Registration error.');
                res.redirect('/');
              } else {
        //        alert('Registration successful.');
                next(null, doc.ops[0]);
              }
            });
          }
        });
      },
      passport.authenticate('local', { failureRedirect: '/' }),
      (req, res, next) => {
        res.redirect('/intro');
      }
    );

  app.route('/db/scenario')
    .get((req, res, next) => {
      myDataBase.findOne({ username: req.user.username }, function(err, doc) {
        let scenArr = [];
        if (err) {
          console.log(err);
        };          
        //console.log(doc);
        if (doc.scenarios.length > 0) {
          doc.scenarios.forEach((elm) => { scenArr.push(elm.scen_name) } );
        }
        res.json(scenArr);
      })
    })
    .post((req, res, next) => {
      /* New scenario */
      if (req.body.new_scen_name) {
        myDataBase.findOne({ username: req.user.username }, function(err, doc2) {
          let match = doc2.scenarios.find((elm) => elm.scen_name === req.body.new_scen_name);
          if (match !== undefined) { 
            res.send("Scenario name already exists.");
            } else {
              myDataBase.findOneAndUpdate(
                { username: req.user.username },
                { 
                  $set: { currentScen: req.body.new_scen_name },
                  $push: { scenarios: 
                    { 
                    scen_name: req.body.new_scen_name,
                    last_update: new Date()
                    }
                  }
                },
                { returnOriginal: false },
                function(err, doc) {
                  let scenArr = [];
                  if (err) { console.log(err) };
                  doc.value.scenarios.forEach((elm) => { scenArr.push(elm.scen_name) } );
                  let scenResult = doc.value.scenarios.find((elm) => elm.scen_name === req.body.new_scen_name);
                  let result = {
                    scenArr,
                    scenResult
                  };
                  console.log(doc);
                  res.json(result);
                }
              );
            }
          });
        /* Existing scenario */
        } else {
        myDataBase.findOneAndUpdate(
          { username: req.user.username },
          {
            $set: { currentScen: req.body.exist_scen_name }
          },
          { returnOriginal: false },
          function(err, doc) {
            let scenArr = [];
            if (err) { console.log(err) };
            doc.value.scenarios.forEach((elm) => { scenArr.push(elm.scen_name) } );
            let scenResult = doc.value.scenarios.find((elm) => elm.scen_name === req.body.exist_scen_name);
            let result = {
              scenArr,
              scenResult
            };
            console.log(doc);
            res.json(result);
          }
        );
      }
    })
    .put((req, res, next) => {
      myDataBase.findOneAndUpdate(
        { username: req.user.username },
        { 
          $pull: { scenarios: { scen_name: req.body.scen_delete } },
          $set: { currentScen: null }
        },
        { returnOriginal: false },
        function(err, doc) {
          if (err) {
            console.log(err);
            res.send("Delete error.");
          } else {
            console.log(doc);
            res.send('Delete successful.');
          }
        }
      );
    });

  app.route("/db/data")
    .get((req, res, next) => {
      myDataBase.findOne({ username: req.user.username }, function(err, doc) {
        if (err) { console.log(err) }
        else {
          let result = doc.scenarios.find((elm) => elm.scen_name === doc.currentScen);
          res.json(result);
        };
      });
    });
    
  app.route("/db/data/intro")    
    .post((req, res, next) => {
      myDataBase.findOneAndUpdate(
        { username: req.user.username },
        {
          $set: {
            "scenarios.$[element].last_update": new Date(),
            "scenarios.$[element].org_type": req.body.org_type,
            "scenarios.$[element].comm_name": req.body.comm_name,
            "scenarios.$[element].pop_size": req.body.pop_size,
            "scenarios.$[element].pop_growth": req.body.pop_growth,
            "scenarios.$[element].prov_terr": req.body.prov_terr,
            "scenarios.$[element].flood_prone": req.body.flood_prone,
            "scenarios.$[element].gas_conx": req.body.gas_conx,
            "scenarios.$[element].waste_cont": req.body.waste_cont,
            "scenarios.$[element].cent_water": req.body.cent_water,
            "scenarios.$[element].public_tran": req.body.public_tran,
            "scenarios.$[element].sig_murb_stock": req.body.sig_murb_stock,
            "scenarios.$[element].sig_comm_stock": req.body.sig_comm_stock,
            "scenarios.$[element].pub_sect_orgs": req.body.pub_sect_orgs,
            "scenarios.$[element].priv_sect_oper": req.body.priv_sect_oper,
          },
        },
        { arrayFilters: [ { "element.scen_name": { $eq: req.body.scen_carry } } ],
          returnOriginal: false
        },
        (err, doc) => {
          if (err) {
            console.log(err);
            res.send("Save error.");
          } else {
            let result = doc.value.scenarios.find((elm) => elm.scen_name === doc.value.currentScen);
            console.log(result);
            res.send('Save successful.');
          }
        }
      );
    });

  app.route("/db/data/governance")
    .post((req, res, next) => {
      myDataBase.findOneAndUpdate(
        { username: req.user.username },
        {
          $set: {
            "scenarios.$[element].last_update": new Date(),

            "scenarios.$[element].governance.comm_energy_leader_na": Number(req.body.comm_energy_leader_na),
            "scenarios.$[element].governance.comm_energy_leader_0": Number(req.body.comm_energy_leader_0),
            "scenarios.$[element].governance.comm_energy_leader_1": Number(req.body.comm_energy_leader_1),
            "scenarios.$[element].governance.comm_energy_leader_2": Number(req.body.comm_energy_leader_2),
            "scenarios.$[element].governance.comm_energy_leader_3": Number(req.body.comm_energy_leader_3),
            "scenarios.$[element].governance.comm_energy_leader_4": Number(req.body.comm_energy_leader_4),
            "scenarios.$[element].governance.comm_energy_leader_pts": Number(req.body.comm_energy_leader_pts),
            "scenarios.$[element].governance.comm_energy_leader_notes": req.body.comm_energy_leader_notes,

            "scenarios.$[element].governance.xdept_coord_local_na": Number(req.body.xdept_coord_local_na),
            "scenarios.$[element].governance.xdept_coord_local_0": Number(req.body.xdept_coord_local_0),
            "scenarios.$[element].governance.xdept_coord_local_1": Number(req.body.xdept_coord_local_1),
            "scenarios.$[element].governance.xdept_coord_local_2": Number(req.body.xdept_coord_local_2),
            "scenarios.$[element].governance.xdept_coord_local_pts": Number(req.body.xdept_coord_local_pts),
            "scenarios.$[element].governance.xdept_coord_local_notes": req.body.xdept_coord_local_notes,

            "scenarios.$[element].governance.align_local_elec_na": Number(req.body.align_local_elec_na),
            "scenarios.$[element].governance.align_local_elec_0": Number(req.body.align_local_elec_0),
            "scenarios.$[element].governance.align_local_elec_1": Number(req.body.align_local_elec_1),
            "scenarios.$[element].governance.align_local_elec_2": Number(req.body.align_local_elec_2),
            "scenarios.$[element].governance.align_local_elec_pts": Number(req.body.align_local_elec_pts),
            "scenarios.$[element].governance.align_local_elec_notes": req.body.align_local_elec_notes,

            "scenarios.$[element].governance.align_local_gas_na": Number(req.body.align_local_gas_na),
            "scenarios.$[element].governance.align_local_gas_0": Number(req.body.align_local_gas_0),
            "scenarios.$[element].governance.align_local_gas_1": Number(req.body.align_local_gas_1),
            "scenarios.$[element].governance.align_local_gas_2": Number(req.body.align_local_gas_2),
            "scenarios.$[element].governance.align_local_gas_pts": Number(req.body.align_local_gas_pts),
            "scenarios.$[element].governance.align_local_gas_notes": req.body.align_local_gas_notes,
             
            "scenarios.$[element].governance.knowledge_share_na": Number(req.body.knowledge_share_na),
            "scenarios.$[element].governance.knowledge_share": Number(req.body.knowledge_share),
            "scenarios.$[element].governance.knowledge_share_pts": Number(req.body.knowledge_share_pts),
            "scenarios.$[element].governance.knowledge_share_notes": req.body.knowledge_share_notes,

            "scenarios.$[element].governance.z_app_pts_total": Number(req.body.z_app_pts_total),
            "scenarios.$[element].governance.z_na_pts_total": Number(req.body.z_na_pts_total),
            "scenarios.$[element].governance.z_sect_complete": req.body.z_sect_complete,
          },
        },
        { arrayFilters: [ { "element.scen_name": { $eq: req.body.scen_carry } } ],
          returnOriginal: false
        },
        (err, doc) => {
          if (err) {
            console.log(err);
            res.send("Save error.");
          } else {
            let result = doc.value.scenarios.find((elm) => elm.scen_name === doc.value.currentScen);
            console.log(result.governance);
            res.send('Save successful.');
          }
        }
      );
    });

  app.route("/db/data/staff")
    .post((req, res, next) => {
      myDataBase.findOneAndUpdate(
        { username: req.user.username },
        {
          $set: {
            "scenarios.$[element].last_update": new Date(),

            "scenarios.$[element].staff.local_task_manage_na": Number(req.body.local_task_manage_na),
            "scenarios.$[element].staff.local_task_manage": Number(req.body.local_task_manage),
            "scenarios.$[element].staff.local_task_manage_pts": Number(req.body.local_task_manage_pts),
            "scenarios.$[element].staff.local_task_manage_notes": req.body.local_task_manage_notes,

            "scenarios.$[element].staff.comm_posit_supp_na": Number(req.body.comm_posit_supp_na),
            "scenarios.$[element].staff.comm_posit_supp": Number(req.body.comm_posit_supp),
            "scenarios.$[element].staff.comm_posit_supp_pts": Number(req.body.comm_posit_supp_pts),
            "scenarios.$[element].staff.comm_posit_supp_notes": req.body.comm_posit_supp_notes,

            "scenarios.$[element].staff.elec_res_init_na": Number(req.body.elec_res_init_na),
            "scenarios.$[element].staff.elec_res_init": Number(req.body.elec_res_init),
            "scenarios.$[element].staff.elec_res_init_pts": Number(req.body.elec_res_init_pts),
            "scenarios.$[element].staff.elec_res_init_notes": req.body.elec_res_init_notes,

            "scenarios.$[element].staff.gas_res_init_na": Number(req.body.gas_res_init_na),
            "scenarios.$[element].staff.gas_res_init": Number(req.body.gas_res_init),
            "scenarios.$[element].staff.gas_res_init_pts": Number(req.body.gas_res_init_pts),
            "scenarios.$[element].staff.gas_res_init_notes": req.body.gas_res_init_notes,

            "scenarios.$[element].staff.bld_insp_edu_na": Number(req.body.bld_insp_edu_na),
            "scenarios.$[element].staff.bld_insp_edu_0": Number(req.body.bld_insp_edu_0),
            "scenarios.$[element].staff.bld_insp_edu_1": Number(req.body.bld_insp_edu_1),
            "scenarios.$[element].staff.bld_insp_edu_pts": Number(req.body.bld_insp_edu_pts),
            "scenarios.$[element].staff.bld_insp_edu_notes": req.body.bld_insp_edu_notes,
              
            "scenarios.$[element].staff.elec_supp_edu_na": Number(req.body.elec_supp_edu_na),
            "scenarios.$[element].staff.elec_supp_edu": Number(req.body.elec_supp_edu),
            "scenarios.$[element].staff.elec_supp_edu_pts": Number(req.body.elec_supp_edu_pts),
            "scenarios.$[element].staff.elec_supp_edu_notes": req.body.elec_supp_edu_notes,
            
            "scenarios.$[element].staff.gas_supp_edu_na": Number(req.body.gas_supp_edu_na),
            "scenarios.$[element].staff.gas_supp_edu": Number(req.body.gas_supp_edu),
            "scenarios.$[element].staff.gas_supp_edu_pts": Number(req.body.gas_supp_edu_pts),
            "scenarios.$[element].staff.gas_supp_edu_notes": req.body.gas_supp_edu_notes,

            "scenarios.$[element].staff.succ_plan_init_na": Number(req.body.succ_plan_init_na),
            "scenarios.$[element].staff.succ_plan_init_0": Number(req.body.succ_plan_init_0),
            "scenarios.$[element].staff.succ_plan_init_1": Number(req.body.succ_plan_init_1),
            "scenarios.$[element].staff.succ_plan_init_2": Number(req.body.succ_plan_init_2),
            "scenarios.$[element].staff.succ_plan_init_3": Number(req.body.succ_plan_init_3),
            "scenarios.$[element].staff.succ_plan_init_pts": Number(req.body.succ_plan_init_pts),
            "scenarios.$[element].staff.succ_plan_init_notes": req.body.succ_plan_init_notes,

            "scenarios.$[element].staff.z_app_pts_total": Number(req.body.z_app_pts_total),
            "scenarios.$[element].staff.z_na_pts_total": Number(req.body.z_na_pts_total),
            "scenarios.$[element].staff.z_sect_complete": req.body.z_sect_complete,
          },
        },
        { arrayFilters: [ { "element.scen_name": { $eq: req.body.scen_carry } } ],
          returnOriginal: false
        },
        (err, doc) => {
          if (err) {
            console.log(err);
            res.send("Save error.");
          } else {
            let result = doc.value.scenarios.find((elm) => elm.scen_name === doc.value.currentScen);
            console.log(result.staff);
            res.send('Save successful.');
          }
        }
      );
    });

  app.route("/db/data/data")
    .post((req, res, next) => {
      myDataBase.findOneAndUpdate(
        { username: req.user.username },
        {
          $set: {
            "scenarios.$[element].last_update": new Date(),

            "scenarios.$[element].data.elec_commit_share_na": Number(req.body.elec_commit_share_na),
            "scenarios.$[element].data.elec_commit_share": Number(req.body.elec_commit_share),
            "scenarios.$[element].data.elec_commit_share_pts": Number(req.body.elec_commit_share_pts),
            "scenarios.$[element].data.elec_commit_share_notes": req.body.elec_commit_share_notes,

            "scenarios.$[element].data.gas_commit_share_na": Number(req.body.gas_commit_share_na),
            "scenarios.$[element].data.gas_commit_share": Number(req.body.gas_commit_share),
            "scenarios.$[element].data.gas_commit_share_pts": Number(req.body.gas_commit_share_pts),
            "scenarios.$[element].data.gas_commit_share_notes": req.body.gas_commit_share_notes,

            "scenarios.$[element].data.comm_inv_rep_na": Number(req.body.comm_inv_rep_na),
            "scenarios.$[element].data.comm_inv_rep_0": Number(req.body.comm_inv_rep_0),
            "scenarios.$[element].data.comm_inv_rep_1": Number(req.body.comm_inv_rep_1),
            "scenarios.$[element].data.comm_inv_rep_2": Number(req.body.comm_inv_rep_2),
            "scenarios.$[element].data.comm_inv_rep_3": Number(req.body.comm_inv_rep_3),
            "scenarios.$[element].data.comm_inv_rep_4": Number(req.body.comm_inv_rep_4),
            "scenarios.$[element].data.comm_inv_rep_5": Number(req.body.comm_inv_rep_5),
            "scenarios.$[element].data.comm_inv_rep_6": Number(req.body.comm_inv_rep_6),
            "scenarios.$[element].data.comm_inv_rep_pts": Number(req.body.comm_inv_rep_pts),
            "scenarios.$[element].data.comm_inv_rep_notes": req.body.comm_inv_rep_notes,

            "scenarios.$[element].data.local_inv_rep_na": Number(req.body.local_inv_rep_na),
            "scenarios.$[element].data.local_inv_rep_0": Number(req.body.local_inv_rep_0),
            "scenarios.$[element].data.local_inv_rep_1": Number(req.body.local_inv_rep_1),
            "scenarios.$[element].data.local_inv_rep_2": Number(req.body.local_inv_rep_2),
            "scenarios.$[element].data.local_inv_rep_3": Number(req.body.local_inv_rep_3),
            "scenarios.$[element].data.local_inv_rep_4": Number(req.body.local_inv_rep_4),
            "scenarios.$[element].data.local_inv_rep_5": Number(req.body.local_inv_rep_5),
            "scenarios.$[element].data.local_inv_rep_pts": Number(req.body.local_inv_rep_pts),
            "scenarios.$[element].data.local_inv_rep_notes": req.body.local_inv_rep_notes,

            "scenarios.$[element].data.elec_inv_rep_na": Number(req.body.elec_inv_rep_na),
            "scenarios.$[element].data.elec_inv_rep_0": Number(req.body.elec_inv_rep_0),
            "scenarios.$[element].data.elec_inv_rep_1": Number(req.body.elec_inv_rep_1),
            "scenarios.$[element].data.elec_inv_rep_2": Number(req.body.elec_inv_rep_2),
            "scenarios.$[element].data.elec_inv_rep_3": Number(req.body.elec_inv_rep_3),
            "scenarios.$[element].data.elec_inv_rep_4": Number(req.body.elec_inv_rep_4),
            "scenarios.$[element].data.elec_inv_rep_5": Number(req.body.elec_inv_rep_5),
            "scenarios.$[element].data.elec_inv_rep_pts": Number(req.body.elec_inv_rep_pts),
            "scenarios.$[element].data.elec_inv_rep_notes": req.body.elec_inv_rep_notes,

            "scenarios.$[element].data.gas_inv_rep_na": Number(req.body.gas_inv_rep_na),
            "scenarios.$[element].data.gas_inv_rep_0": Number(req.body.gas_inv_rep_0),
            "scenarios.$[element].data.gas_inv_rep_1": Number(req.body.gas_inv_rep_1),
            "scenarios.$[element].data.gas_inv_rep_2": Number(req.body.gas_inv_rep_2),
            "scenarios.$[element].data.gas_inv_rep_3": Number(req.body.gas_inv_rep_3),
            "scenarios.$[element].data.gas_inv_rep_4": Number(req.body.gas_inv_rep_4),
            "scenarios.$[element].data.gas_inv_rep_5": Number(req.body.gas_inv_rep_5),
            "scenarios.$[element].data.gas_inv_rep_pts": Number(req.body.gas_inv_rep_pts),
            "scenarios.$[element].data.gas_inv_rep_notes": req.body.gas_inv_rep_notes,

            "scenarios.$[element].data.clim_haz_success_na": Number(req.body.clim_haz_success_na),
            "scenarios.$[element].data.clim_haz_success_0": Number(req.body.clim_haz_success_0),
            "scenarios.$[element].data.clim_haz_success_1": Number(req.body.clim_haz_success_1),
            "scenarios.$[element].data.clim_haz_success_2": Number(req.body.clim_haz_success_2),
            "scenarios.$[element].data.clim_haz_success_3": Number(req.body.clim_haz_success_3),
            "scenarios.$[element].data.clim_haz_success_pts": Number(req.body.clim_haz_success_pts),
            "scenarios.$[element].data.clim_haz_success_notes": req.body.clim_haz_success_notes,

            "scenarios.$[element].data.energy_mapping_na": Number(req.body.energy_mapping_na),
            "scenarios.$[element].data.energy_mapping_0": Number(req.body.energy_mapping_0),
            "scenarios.$[element].data.energy_mapping_1": Number(req.body.energy_mapping_1),
            "scenarios.$[element].data.energy_mapping_2": Number(req.body.energy_mapping_2),
            "scenarios.$[element].data.energy_mapping_3": Number(req.body.energy_mapping_3),
            "scenarios.$[element].data.energy_mapping_4": Number(req.body.energy_mapping_4),
            "scenarios.$[element].data.energy_mapping_pts": Number(req.body.energy_mapping_pts),
            "scenarios.$[element].data.energy_mapping_notes": req.body.energy_mapping_notes,

            "scenarios.$[element].data.scenario_model_na": Number(req.body.scenario_model_na),
            "scenarios.$[element].data.scenario_model_0": Number(req.body.scenario_model_0),
            "scenarios.$[element].data.scenario_model_1": Number(req.body.scenario_model_1),
            "scenarios.$[element].data.scenario_model_2": Number(req.body.scenario_model_2),
            "scenarios.$[element].data.scenario_model_3": Number(req.body.scenario_model_3),
            "scenarios.$[element].data.scenario_model_4": Number(req.body.scenario_model_4),
            "scenarios.$[element].data.scenario_model_pts": Number(req.body.scenario_model_pts),
            "scenarios.$[element].data.scenario_model_notes": req.body.scenario_model_notes,

            "scenarios.$[element].data.z_app_pts_total": Number(req.body.z_app_pts_total),
            "scenarios.$[element].data.z_na_pts_total": Number(req.body.z_na_pts_total),
            "scenarios.$[element].data.z_sect_complete": req.body.z_sect_complete,
          },
        },
        { arrayFilters: [ { "element.scen_name": { $eq: req.body.scen_carry } } ],
          returnOriginal: false
        },
        (err, doc) => {
          if (err) {
            console.log(err);
            res.send("Save error.");
          } else {
            let result = doc.value.scenarios.find((elm) => elm.scen_name === doc.value.currentScen);
            console.log(result.data);
            res.send('Save successful.');
          }
        }
      );
    });

  app.route("/db/data/financials")
    .post((req, res, next) => {
      myDataBase.findOneAndUpdate(
        { username: req.user.username },
        {
          $set: {
            "scenarios.$[element].last_update": new Date(),

            "scenarios.$[element].financials.assess_mech_fund_na": Number(req.body.assess_mech_fund_na),
            "scenarios.$[element].financials.assess_mech_fund_0": Number(req.body.assess_mech_fund_0),
            "scenarios.$[element].financials.assess_mech_fund_1": Number(req.body.assess_mech_fund_1),
            "scenarios.$[element].financials.assess_mech_fund_2": Number(req.body.assess_mech_fund_2),
            "scenarios.$[element].financials.assess_mech_fund_3": Number(req.body.assess_mech_fund_3),
            "scenarios.$[element].financials.assess_mech_fund_pts": Number(req.body.assess_mech_fund_pts),
            "scenarios.$[element].financials.assess_mech_fund_notes": req.body.assess_mech_fund_notes,

            "scenarios.$[element].financials.mech_corp_init_na": Number(req.body.mech_corp_init_na),
            "scenarios.$[element].financials.mech_corp_init": Number(req.body.mech_corp_init),
            "scenarios.$[element].financials.mech_corp_init_pts": Number(req.body.mech_corp_init_pts),
            "scenarios.$[element].financials.mech_corp_init_notes": req.body.mech_corp_init_notes,

            "scenarios.$[element].financials.fees_auto_cong_na": Number(req.body.fees_auto_cong_na),
            "scenarios.$[element].financials.fees_auto_cong_0": Number(req.body.fees_auto_cong_0),
            "scenarios.$[element].financials.fees_auto_cong_1": Number(req.body.fees_auto_cong_1),
            "scenarios.$[element].financials.fees_auto_cong_2": Number(req.body.fees_auto_cong_2),
            "scenarios.$[element].financials.fees_auto_cong_pts": Number(req.body.fees_auto_cong_pts),
            "scenarios.$[element].financials.fees_auto_cong_notes": req.body.fees_auto_cong_notes,

            "scenarios.$[element].financials.fund_act_transp_na": Number(req.body.fund_act_transp_na),
            "scenarios.$[element].financials.fund_act_transp": Number(req.body.fund_act_transp),
            "scenarios.$[element].financials.fund_act_transp_pts": Number(req.body.fund_act_transp_pts),
            "scenarios.$[element].financials.fund_act_transp_notes": req.body.fund_act_transp_notes,

            "scenarios.$[element].financials.fin_levers_dens_na": Number(req.body.fin_levers_dens_na),
            "scenarios.$[element].financials.fin_levers_dens": Number(req.body.fin_levers_dens),
            "scenarios.$[element].financials.fin_levers_dens_pts": Number(req.body.fin_levers_dens_pts),
            "scenarios.$[element].financials.fin_levers_dens_notes": req.body.fin_levers_dens_notes,

            "scenarios.$[element].financials.incent_init_bldgs_na": Number(req.body.incent_init_bldgs_na),
            "scenarios.$[element].financials.incent_init_bldgs_0": Number(req.body.incent_init_bldgs_0),
            "scenarios.$[element].financials.incent_init_bldgs_1": Number(req.body.incent_init_bldgs_1),
            "scenarios.$[element].financials.incent_init_bldgs_2": Number(req.body.incent_init_bldgs_2),
            "scenarios.$[element].financials.incent_init_bldgs_pts": Number(req.body.incent_init_bldgs_pts),
            "scenarios.$[element].financials.incent_init_bldgs_notes": req.body.incent_init_bldgs_notes,

            "scenarios.$[element].financials.retro_exist_single_na": Number(req.body.retro_exist_single_na),
            "scenarios.$[element].financials.retro_exist_single_0": Number(req.body.retro_exist_single_0),
            "scenarios.$[element].financials.retro_exist_single_1": Number(req.body.retro_exist_single_1),
            "scenarios.$[element].financials.retro_exist_single_2": Number(req.body.retro_exist_single_2),
            "scenarios.$[element].financials.retro_exist_single_3": Number(req.body.retro_exist_single_3),
            "scenarios.$[element].financials.retro_exist_single_4": Number(req.body.retro_exist_single_4),
            "scenarios.$[element].financials.retro_exist_single_pts": Number(req.body.retro_exist_single_pts),
            "scenarios.$[element].financials.retro_exist_single_notes": req.body.retro_exist_single_notes,

            "scenarios.$[element].financials.retro_exist_murb_na": Number(req.body.retro_exist_murb_na),
            "scenarios.$[element].financials.retro_exist_murb_0": Number(req.body.retro_exist_murb_0),
            "scenarios.$[element].financials.retro_exist_murb_1": Number(req.body.retro_exist_murb_1),
            "scenarios.$[element].financials.retro_exist_murb_2": Number(req.body.retro_exist_murb_2),
            "scenarios.$[element].financials.retro_exist_murb_3": Number(req.body.retro_exist_murb_3),
            "scenarios.$[element].financials.retro_exist_murb_4": Number(req.body.retro_exist_murb_4),
            "scenarios.$[element].financials.retro_exist_murb_pts": Number(req.body.retro_exist_murb_pts),
            "scenarios.$[element].financials.retro_exist_murb_notes": req.body.retro_exist_murb_notes,

            "scenarios.$[element].financials.retro_exist_comm_na": Number(req.body.retro_exist_comm_na),
            "scenarios.$[element].financials.retro_exist_comm_0": Number(req.body.retro_exist_comm_0),
            "scenarios.$[element].financials.retro_exist_comm_1": Number(req.body.retro_exist_comm_1),
            "scenarios.$[element].financials.retro_exist_comm_2": Number(req.body.retro_exist_comm_2),
            "scenarios.$[element].financials.retro_exist_comm_3": Number(req.body.retro_exist_comm_3),
            "scenarios.$[element].financials.retro_exist_comm_4": Number(req.body.retro_exist_comm_4),
            "scenarios.$[element].financials.retro_exist_comm_pts": Number(req.body.retro_exist_comm_pts),
            "scenarios.$[element].financials.retro_exist_comm_notes": req.body.retro_exist_comm_notes,

            "scenarios.$[element].financials.prog_pov_lowinc_na": Number(req.body.prog_pov_lowinc_na),
            "scenarios.$[element].financials.prog_pov_lowinc": Number(req.body.prog_pov_lowinc),
            "scenarios.$[element].financials.prog_pov_lowinc_pts": Number(req.body.prog_pov_lowinc_pts),
            "scenarios.$[element].financials.prog_pov_lowinc_notes": req.body.prog_pov_lowinc_notes,

            "scenarios.$[element].financials.z_app_pts_total": Number(req.body.z_app_pts_total),
            "scenarios.$[element].financials.z_na_pts_total": Number(req.body.z_na_pts_total),
            "scenarios.$[element].financials.z_sect_complete": req.body.z_sect_complete,          },
        },
        { arrayFilters: [ { "element.scen_name": { $eq: req.body.scen_carry } } ],
          returnOriginal: false
        },
        (err, doc) => {
          if (err) {
            console.log(err);
            res.send("Save error.");
          } else {
            let result = doc.value.scenarios.find((elm) => elm.scen_name === doc.value.currentScen);
            console.log(result.financials);
            res.send('Save successful.');
          }
        }
      );
    });

  app.route("/db/data/strategy")
    .post((req, res, next) => {
      myDataBase.findOneAndUpdate(
        { username: req.user.username },
        {
          $set: {
            "scenarios.$[element].last_update": new Date(),

            "scenarios.$[element].strategy.comm_eng_vgp_na": Number(req.body.comm_eng_vgp_na),
            "scenarios.$[element].strategy.comm_eng_vgp_0": Number(req.body.comm_eng_vgp_0),
            "scenarios.$[element].strategy.comm_eng_vgp_1": Number(req.body.comm_eng_vgp_1),
            "scenarios.$[element].strategy.comm_eng_vgp_2": Number(req.body.comm_eng_vgp_2),
            "scenarios.$[element].strategy.comm_eng_vgp_3": Number(req.body.comm_eng_vgp_3),
            "scenarios.$[element].strategy.comm_eng_vgp_4": Number(req.body.comm_eng_vgp_4),
            "scenarios.$[element].strategy.comm_eng_vgp_pts": Number(req.body.comm_eng_vgp_pts),
            "scenarios.$[element].strategy.comm_eng_vgp_notes": req.body.comm_eng_vgp_notes,

            "scenarios.$[element].strategy.comm_econ_anal_na": Number(req.body.comm_econ_anal_na),
            "scenarios.$[element].strategy.comm_econ_anal_0": Number(req.body.comm_econ_anal_0),
            "scenarios.$[element].strategy.comm_econ_anal_1": Number(req.body.comm_econ_anal_1),
            "scenarios.$[element].strategy.comm_econ_anal_pts": Number(req.body.comm_econ_anal_pts),
            "scenarios.$[element].strategy.comm_econ_anal_notes": req.body.comm_econ_anal_notes,

            "scenarios.$[element].strategy.plan_manage_init_na": Number(req.body.plan_manage_init_na),
            "scenarios.$[element].strategy.plan_manage_init_0": Number(req.body.plan_manage_init_0),
            "scenarios.$[element].strategy.plan_manage_init_1": Number(req.body.plan_manage_init_1),
            "scenarios.$[element].strategy.plan_manage_init_2": Number(req.body.plan_manage_init_2),
            "scenarios.$[element].strategy.plan_manage_init_3": Number(req.body.plan_manage_init_3),
            "scenarios.$[element].strategy.plan_manage_init_pts": Number(req.body.plan_manage_init_pts),
            "scenarios.$[element].strategy.plan_manage_init_notes": req.body.plan_manage_init_notes,

            "scenarios.$[element].strategy.holist_integ_appr_na": Number(req.body.holist_integ_appr_na),
            "scenarios.$[element].strategy.holist_integ_appr_0": Number(req.body.holist_integ_appr_0),
            "scenarios.$[element].strategy.holist_integ_appr_1": Number(req.body.holist_integ_appr_1),
            "scenarios.$[element].strategy.holist_integ_appr_2": Number(req.body.holist_integ_appr_2),
            "scenarios.$[element].strategy.holist_integ_appr_pts": Number(req.body.holist_integ_appr_pts),
            "scenarios.$[element].strategy.holist_integ_appr_notes": req.body.holist_integ_appr_notes,

            "scenarios.$[element].strategy.smart_comm_init_na": Number(req.body.smart_comm_init_na),
            "scenarios.$[element].strategy.smart_comm_init_0": Number(req.body.smart_comm_init_0),
            "scenarios.$[element].strategy.smart_comm_init_1": Number(req.body.smart_comm_init_1),
            "scenarios.$[element].strategy.smart_comm_init_2": Number(req.body.smart_comm_init_2),
            "scenarios.$[element].strategy.smart_comm_init_3": Number(req.body.smart_comm_init_3),
            "scenarios.$[element].strategy.smart_comm_init_4": Number(req.body.smart_comm_init_4),
            "scenarios.$[element].strategy.smart_comm_init_5": Number(req.body.smart_comm_init_5),
            "scenarios.$[element].strategy.smart_comm_init_pts": Number(req.body.smart_comm_init_pts),
            "scenarios.$[element].strategy.smart_comm_init_notes": req.body.smart_comm_init_notes,

            "scenarios.$[element].strategy.est_plan_ongoing_na": Number(req.body.est_plan_ongoing_na),
            "scenarios.$[element].strategy.est_plan_ongoing_0": Number(req.body.est_plan_ongoing_0),
            "scenarios.$[element].strategy.est_plan_ongoing_1": Number(req.body.est_plan_ongoing_1),
            "scenarios.$[element].strategy.est_plan_ongoing_2": Number(req.body.est_plan_ongoing_2),
            "scenarios.$[element].strategy.est_plan_ongoing_pts": Number(req.body.est_plan_ongoing_pts),
            "scenarios.$[element].strategy.est_plan_ongoing_notes": req.body.est_plan_ongoing_notes,

            "scenarios.$[element].strategy.z_app_pts_total": Number(req.body.z_app_pts_total),
            "scenarios.$[element].strategy.z_na_pts_total": Number(req.body.z_na_pts_total),
            "scenarios.$[element].strategy.z_sect_complete": req.body.z_sect_complete,
          },
        },
        { arrayFilters: [ { "element.scen_name": { $eq: req.body.scen_carry } } ],
          returnOriginal: false
        },
        (err, doc) => {
          if (err) {
            console.log(err);
            res.send("Save error.");
          } else {
            let result = doc.value.scenarios.find((elm) => elm.scen_name === doc.value.currentScen);
            console.log(result.strategy);
            res.send('Save successful.');
          }
        }
      );
    });

  app.route("/db/data/land_use")
    .post((req, res, next) => {
      myDataBase.findOneAndUpdate(
        { username: req.user.username },
        {
          $set: {
            "scenarios.$[element].last_update": new Date(),

            "scenarios.$[element].land_use.public_eng_edu_na": Number(req.body.public_eng_edu_na),
            "scenarios.$[element].land_use.public_eng_edu_0": Number(req.body.public_eng_edu_0),
            "scenarios.$[element].land_use.public_eng_edu_1": Number(req.body.public_eng_edu_1),
            "scenarios.$[element].land_use.public_eng_edu_2": Number(req.body.public_eng_edu_2),
            "scenarios.$[element].land_use.public_eng_edu_pts": Number(req.body.public_eng_edu_pts),
            "scenarios.$[element].land_use.public_eng_edu_notes": req.body.public_eng_edu_notes,

            "scenarios.$[element].land_use.comp_mu_tod_na": Number(req.body.comp_mu_tod_na),
            "scenarios.$[element].land_use.comp_mu_tod_0": Number(req.body.comp_mu_tod_0),
            "scenarios.$[element].land_use.comp_mu_tod_1": Number(req.body.comp_mu_tod_1),
            "scenarios.$[element].land_use.comp_mu_tod_2": Number(req.body.comp_mu_tod_2),
            "scenarios.$[element].land_use.comp_mu_tod_3": Number(req.body.comp_mu_tod_3),
            "scenarios.$[element].land_use.comp_mu_tod_pts": Number(req.body.comp_mu_tod_pts),
            "scenarios.$[element].land_use.comp_mu_tod_notes": req.body.comp_mu_tod_notes,

            "scenarios.$[element].land_use.eff_perf_newdev_na": Number(req.body.eff_perf_newdev_na),
            "scenarios.$[element].land_use.eff_perf_newdev_0": Number(req.body.eff_perf_newdev_0),
            "scenarios.$[element].land_use.eff_perf_newdev_1": Number(req.body.eff_perf_newdev_1),
            "scenarios.$[element].land_use.eff_perf_newdev_2": Number(req.body.eff_perf_newdev_1),
            "scenarios.$[element].land_use.eff_perf_newdev_pts": Number(req.body.eff_perf_newdev_pts),
            "scenarios.$[element].land_use.eff_perf_newdev_notes": req.body.eff_perf_newdev_notes,

            "scenarios.$[element].land_use.embed_opt_plans_na": Number(req.body.embed_opt_plans_na),
            "scenarios.$[element].land_use.embed_opt_plans": Number(req.body.embed_opt_plans),
            "scenarios.$[element].land_use.embed_opt_plans_pts": Number(req.body.embed_opt_plans_pts),
            "scenarios.$[element].land_use.embed_opt_plans_notes": req.body.embed_opt_plans_notes,

            "scenarios.$[element].land_use.preserv_nat_lu_na": Number(req.body.preserv_nat_lu_na),
            "scenarios.$[element].land_use.preserv_nat_lu": Number(req.body.preserv_nat_lu),
            "scenarios.$[element].land_use.preserv_nat_lu_pts": Number(req.body.preserv_nat_lu_pts),
            "scenarios.$[element].land_use.preserv_nat_lu_notes": req.body.preserv_nat_lu_notes,

            "scenarios.$[element].land_use.prog_enhance_mitigate_na": Number(req.body.prog_enhance_mitigate_na),
            "scenarios.$[element].land_use.prog_enhance_mitigate_0": Number(req.body.prog_enhance_mitigate_0),
            "scenarios.$[element].land_use.prog_enhance_mitigate_1_1": Number(req.body.prog_enhance_mitigate_1_1),
            "scenarios.$[element].land_use.prog_enhance_mitigate_1_2": Number(req.body.prog_enhance_mitigate_1_2),
            "scenarios.$[element].land_use.prog_enhance_mitigate_1_3": Number(req.body.prog_enhance_mitigate_1_3),
            "scenarios.$[element].land_use.prog_enhance_mitigate_1_4": Number(req.body.prog_enhance_mitigate_1_4),
            "scenarios.$[element].land_use.prog_enhance_mitigate_1_5": Number(req.body.prog_enhance_mitigate_1_5),
            "scenarios.$[element].land_use.prog_enhance_mitigate_2_1": Number(req.body.prog_enhance_mitigate_2_1),
            "scenarios.$[element].land_use.prog_enhance_mitigate_2_2": Number(req.body.prog_enhance_mitigate_2_2),
            "scenarios.$[element].land_use.prog_enhance_mitigate_2_3": Number(req.body.prog_enhance_mitigate_2_3),
            "scenarios.$[element].land_use.prog_enhance_mitigate_2_4": Number(req.body.prog_enhance_mitigate_2_4),
            "scenarios.$[element].land_use.prog_enhance_mitigate_pts": Number(req.body.prog_enhance_mitigate_pts),
            "scenarios.$[element].land_use.prog_enhance_mitigate_notes": req.body.prog_enhance_mitigate_notes,

            "scenarios.$[element].land_use.z_app_pts_total": Number(req.body.z_app_pts_total),
            "scenarios.$[element].land_use.z_na_pts_total": Number(req.body.z_na_pts_total),
            "scenarios.$[element].land_use.z_sect_complete": req.body.z_sect_complete,
          },
        },
        { arrayFilters: [ { "element.scen_name": { $eq: req.body.scen_carry } } ],
          returnOriginal: false
        },
        (err, doc) => {
          if (err) {
            console.log(err);
            res.send("Save error.");
          } else {
            let result = doc.value.scenarios.find((elm) => elm.scen_name === doc.value.currentScen);
            console.log(result.land_use);
            res.send('Save successful.');
          }
        }
      );
    });

  app.route("/db/data/energy_net")
    .post((req, res, next) => {
      myDataBase.findOneAndUpdate(
        { username: req.user.username },
        {
          $set: {
            "scenarios.$[element].last_update": new Date(),

            "scenarios.$[element].energy_net.public_eng_edu_na": Number(req.body.public_eng_edu_na),
            "scenarios.$[element].energy_net.public_eng_edu_0": Number(req.body.public_eng_edu_0),
            "scenarios.$[element].energy_net.public_eng_edu_1": Number(req.body.public_eng_edu_1),
            "scenarios.$[element].energy_net.public_eng_edu_2": Number(req.body.public_eng_edu_2),
            "scenarios.$[element].energy_net.public_eng_edu_3": Number(req.body.public_eng_edu_3),
            "scenarios.$[element].energy_net.public_eng_edu_pts": Number(req.body.public_eng_edu_pts),
            "scenarios.$[element].energy_net.public_eng_edu_notes": req.body.public_eng_edu_notes,

            "scenarios.$[element].energy_net.elec_load_mgmt_na": Number(req.body.elec_load_mgmt_na),
            "scenarios.$[element].energy_net.elec_load_mgmt": Number(req.body.elec_load_mgmt),
            "scenarios.$[element].energy_net.elec_load_mgmt_pts": Number(req.body.elec_load_mgmt_pts),
            "scenarios.$[element].energy_net.elec_load_mgmt_notes": req.body.elec_load_mgmt_notes,

            "scenarios.$[element].energy_net.gas_load_mgmt_na": Number(req.body.gas_load_mgmt_na),
            "scenarios.$[element].energy_net.gas_load_mgmt": Number(req.body.gas_load_mgmt),
            "scenarios.$[element].energy_net.gas_load_mgmt_pts": Number(req.body.gas_load_mgmt_pts),
            "scenarios.$[element].energy_net.gas_load_mgmt_notes": req.body.gas_load_mgmt_notes,

            "scenarios.$[element].energy_net.climate_risk_elec_na": Number(req.body.climate_risk_elec_na),
            "scenarios.$[element].energy_net.climate_risk_elec": Number(req.body.climate_risk_elec),
            "scenarios.$[element].energy_net.climate_risk_elec_pts": Number(req.body.climate_risk_elec_pts),
            "scenarios.$[element].energy_net.climate_risk_elec_notes": req.body.climate_risk_elec_notes,

            "scenarios.$[element].energy_net.climate_risk_gas_na": Number(req.body.climate_risk_gas_na),
            "scenarios.$[element].energy_net.climate_risk_gas": Number(req.body.climate_risk_gas),
            "scenarios.$[element].energy_net.climate_risk_gas_pts": Number(req.body.climate_risk_gas_pts),
            "scenarios.$[element].energy_net.climate_risk_gas_notes": req.body.climate_risk_gas_notes,

            "scenarios.$[element].energy_net.gas_infra_stor_na": Number(req.body.gas_infra_stor_na),
            "scenarios.$[element].energy_net.gas_infra_stor": Number(req.body.gas_infra_stor),
            "scenarios.$[element].energy_net.gas_infra_stor_pts": Number(req.body.gas_infra_stor_pts),
            "scenarios.$[element].energy_net.gas_infra_stor_notes": req.body.gas_infra_stor_notes,

            "scenarios.$[element].energy_net.thermal_local_res_na": Number(req.body.thermal_local_res_na),
            "scenarios.$[element].energy_net.thermal_local_res": Number(req.body.thermal_local_res),
            "scenarios.$[element].energy_net.thermal_local_res_pts": Number(req.body.thermal_local_res_pts),
            "scenarios.$[element].energy_net.thermal_local_res_notes": req.body.thermal_local_res_notes,

            "scenarios.$[element].energy_net.z_app_pts_total": Number(req.body.z_app_pts_total),
            "scenarios.$[element].energy_net.z_na_pts_total": Number(req.body.z_na_pts_total),
            "scenarios.$[element].energy_net.z_sect_complete": req.body.z_sect_complete,

            "scenarios.$[element].energy_net.infra_alt_veh_na": Number(req.body.infra_alt_veh_na),
            "scenarios.$[element].energy_net.infra_alt_veh_0": Number(req.body.infra_alt_veh_0),
            "scenarios.$[element].energy_net.infra_alt_veh_1": Number(req.body.infra_alt_veh_1),
            "scenarios.$[element].energy_net.infra_alt_veh_2": Number(req.body.infra_alt_veh_2),
            "scenarios.$[element].energy_net.infra_alt_veh_3": Number(req.body.infra_alt_veh_3),
            "scenarios.$[element].energy_net.infra_alt_veh_4": Number(req.body.infra_alt_veh_4),
            "scenarios.$[element].energy_net.infra_alt_veh_pts": Number(req.body.infra_alt_veh_pts),
            "scenarios.$[element].energy_net.infra_alt_veh_notes": req.body.infra_alt_veh_notes,

            "scenarios.$[element].energy_net.smart_tech_distinf_na": Number(req.body.smart_tech_distinf_na),
            "scenarios.$[element].energy_net.smart_tech_distinf_0": Number(req.body.smart_tech_distinf_0),
            "scenarios.$[element].energy_net.smart_tech_distinf_1_1": Number(req.body.smart_tech_distinf_1_1),
            "scenarios.$[element].energy_net.smart_tech_distinf_1_2": Number(req.body.smart_tech_distinf_1_2),
            "scenarios.$[element].energy_net.smart_tech_distinf_2_1": Number(req.body.smart_tech_distinf_2_1),
            "scenarios.$[element].energy_net.smart_tech_distinf_2_2": Number(req.body.smart_tech_distinf_2_2),
            "scenarios.$[element].energy_net.smart_tech_distinf_2_3": Number(req.body.smart_tech_distinf_2_3),
            "scenarios.$[element].energy_net.smart_tech_distinf_pts": Number(req.body.smart_tech_distinf_pts),
            "scenarios.$[element].energy_net.smart_tech_distinf_notes": req.body.smart_tech_distinf_notes,          
          },
        },
        { arrayFilters: [ { "element.scen_name": { $eq: req.body.scen_carry } } ],
          returnOriginal: false
        },
        (err, doc) => {
          if (err) {
            console.log(err);
            res.send("Save error.");
          } else {
            let result = doc.value.scenarios.find((elm) => elm.scen_name === doc.value.currentScen);
            console.log(result.energy_net);
            res.send('Save successful.');
          }
        }
      );
    });

  app.route('/intro')
    .get(ensureAuthenticated, (req, res, next) => {
      res.sendFile(process.cwd() + '/views/intro.html');
    });

  app.route('/governance')
    .get(ensureAuthenticated, (req, res) => {
      res.sendFile(process.cwd() + '/views/governance.html');
    });

  app.route('/staff')
    .get(ensureAuthenticated, (req, res) => {
      res.sendFile(process.cwd() + '/views/staff.html');
    });

  app.route('/data')
    .get(ensureAuthenticated, (req, res) => {
      res.sendFile(process.cwd() + '/views/data.html');
    });

  app.route('/financials')
    .get(ensureAuthenticated, (req, res) => {
      res.sendFile(process.cwd() + '/views/financials.html');
    });

  app.route('/strategy')
    .get(ensureAuthenticated, (req, res) => {
      res.sendFile(process.cwd() + '/views/strategy.html');
    });

  app.route('/land_use')
    .get(ensureAuthenticated, (req, res) => {
      res.sendFile(process.cwd() + '/views/land_use.html');
    });

  app.route('/energy_net')
    .get(ensureAuthenticated, (req, res) => {
      res.sendFile(process.cwd() + '/views/energy_net.html');
    });

  app.route('/waste_water')
    .get(ensureAuthenticated, (req, res) => {
      res.sendFile(process.cwd() + '/views/waste_water.html');
    });

  app.route('/transport')
    .get(ensureAuthenticated, (req, res) => {
      res.sendFile(process.cwd() + '/views/transport.html');
    });

  app.route('/buildings')
    .get(ensureAuthenticated, (req, res) => {
      res.sendFile(process.cwd() + '/views/buildings.html');
    });

  app.route('/outputs')
    .get(ensureAuthenticated, (req, res) => {
      res.sendFile(process.cwd() + '/views/outputs.html');
    });

  app.route('/logout')
    .get((req, res) => {
      console.log('User ' + req.user.username + ' has logged out.');
      req.logout();
      res.redirect('/');
    });

  app.use((req, res, next) => {
    res.status(404).type('text').send('Not Found');
  });

  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  };

};