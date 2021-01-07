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
      console.log("hello", req.body.scen_delete);
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

  app.route("/db/data/intro")
    .get((req, res, next) => {
      let result = getData(
        req.user.username, 
        function(err, result) {
          if (err) console.log(err);
          else res.json(result);
        });
      }) 
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
    .get((req, res, next) => {
      let result = getData(
        req.user.username, 
        function(err, result) {
          if (err) console.log(err);
          else res.json(result);
        });
    })  
    .post((req, res, next) => {
      myDataBase.findOneAndUpdate(
        { username: req.user.username },
        {
          $set: {
            "scenarios.$[element].last_update": new Date(),

            "scenarios.$[element].comm_energy_leader_na": Number(req.body.comm_energy_leader_na),
            "scenarios.$[element].comm_energy_leader_0": Number(req.body.comm_energy_leader_0),
            "scenarios.$[element].comm_energy_leader_1": Number(req.body.comm_energy_leader_1),
            "scenarios.$[element].comm_energy_leader_2": Number(req.body.comm_energy_leader_2),
            "scenarios.$[element].comm_energy_leader_3": Number(req.body.comm_energy_leader_3),
            "scenarios.$[element].comm_energy_leader_4": Number(req.body.comm_energy_leader_4),
            "scenarios.$[element].comm_energy_leader_pts": Number(req.body.comm_energy_leader_pts),
            "scenarios.$[element].comm_energy_leader_notes": req.body.comm_energy_leader_notes,

            "scenarios.$[element].xdept_coord_local_na": Number(req.body.xdept_coord_local_na),
            "scenarios.$[element].xdept_coord_local_0": Number(req.body.xdept_coord_local_0),
            "scenarios.$[element].xdept_coord_local_1": Number(req.body.xdept_coord_local_1),
            "scenarios.$[element].xdept_coord_local_2": Number(req.body.xdept_coord_local_2),
            "scenarios.$[element].xdept_coord_local_pts": Number(req.body.xdept_coord_local_pts),
            "scenarios.$[element].xdept_coord_local_notes": req.body.xdept_coord_local_notes,

            "scenarios.$[element].align_local_elec_na": Number(req.body.align_local_elec_na),
            "scenarios.$[element].align_local_elec_0": Number(req.body.align_local_elec_0),
            "scenarios.$[element].align_local_elec_1": Number(req.body.align_local_elec_1),
            "scenarios.$[element].align_local_elec_2": Number(req.body.align_local_elec_2),
            "scenarios.$[element].align_local_elec_pts": Number(req.body.align_local_elec_pts),
            "scenarios.$[element].align_local_elec_notes": req.body.align_local_elec_notes,

            "scenarios.$[element].align_local_gas_na": Number(req.body.align_local_gas_na),
            "scenarios.$[element].align_local_gas_0": Number(req.body.align_local_gas_0),
            "scenarios.$[element].align_local_gas_1": Number(req.body.align_local_gas_1),
            "scenarios.$[element].align_local_gas_2": Number(req.body.align_local_gas_2),
            "scenarios.$[element].align_local_gas_pts": Number(req.body.align_local_gas_pts),
            "scenarios.$[element].align_local_gas_notes": req.body.align_local_gas_notes,
             
            "scenarios.$[element].knowledge_share_na": Number(req.body.knowledge_share_na),
            "scenarios.$[element].knowledge_share": Number(req.body.knowledge_share),
            "scenarios.$[element].knowledge_share_pts": Number(req.body.knowledge_share_pts),
            "scenarios.$[element].knowledge_share_notes": req.body.knowledge_share_notes,
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

  app.route("/db/data/staff")
    .get((req, res, next) => {
      let result = getData(
        req.user.username, 
        function(err, result) {
          if (err) console.log(err);
          else res.json(result);
        });
    })  
    .post((req, res, next) => {
      myDataBase.findOneAndUpdate(
        { username: req.user.username },
        {
          $set: {
            "scenarios.$[element].last_update": new Date(),

            "scenarios.$[element].local_task_manage_na": Number(req.body.local_task_manage_na),
            "scenarios.$[element].local_task_manage": Number(req.body.local_task_manage),
            "scenarios.$[element].local_task_manage_pts": Number(req.body.local_task_manage_pts),
            "scenarios.$[element].local_task_manage_notes": req.body.local_task_manage_notes,

            "scenarios.$[element].comm_posit_supp_na": Number(req.body.comm_posit_supp_na),
            "scenarios.$[element].comm_posit_supp": Number(req.body.comm_posit_supp),
            "scenarios.$[element].comm_posit_supp_pts": Number(req.body.comm_posit_supp_pts),
            "scenarios.$[element].comm_posit_supp_notes": req.body.comm_posit_supp_notes,

            "scenarios.$[element].elec_res_init_na": Number(req.body.elec_res_init_na),
            "scenarios.$[element].elec_res_init": Number(req.body.elec_res_init),
            "scenarios.$[element].elec_res_init_pts": Number(req.body.elec_res_init_pts),
            "scenarios.$[element].elec_res_init_notes": req.body.elec_res_init_notes,

            "scenarios.$[element].gas_res_init_na": Number(req.body.gas_res_init_na),
            "scenarios.$[element].gas_res_init": Number(req.body.gas_res_init),
            "scenarios.$[element].gas_res_init_pts": Number(req.body.gas_res_init_pts),
            "scenarios.$[element].gas_res_init_notes": req.body.gas_res_init_notes,
             
            "scenarios.$[element].local_supp_edu_na": Number(req.body.local_supp_edu_na),
            "scenarios.$[element].local_supp_edu": Number(req.body.local_supp_edu),
            "scenarios.$[element].local_supp_edu_pts": Number(req.body.local_supp_edu_pts),
            "scenarios.$[element].local_supp_edu_notes": req.body.local_supp_edu_notes,
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

  function getData(username, done) {
    myDataBase.findOne({ username: username }, function(err, doc) {
      if (err) return done(err);
      let result = doc.scenarios.find((elm) => elm.scen_name === doc.currentScen);
      done(null, result);
    });
  };

};