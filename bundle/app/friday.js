Pizza = new Meteor.Collection('pizzas');
Visitor = new Meteor.Collection('visitors');

if (Meteor.isClient) {

  SessionAmplify = _.extend({}, Session, {
    keys: _.object(_.map(amplify.store(), function(value, key) {
      return [key, JSON.stringify(value)]
    })),
    set: function (key, value) {
      Session.set.apply(this, arguments);
      amplify.store(key, value);
    },
  });

  function getTempScores(){
    var tempScores = Session.get("temp_scores");
    if (tempScores == undefined) tempScores = {};
    return tempScores;
  }
  function createPizza(url, ing){
    Pizza.insert({ 
      image: url, 
      ingredients: ing, 
      created_at: (new Date().getTime() / 1000), 
      scores: {}
    });
  }
  function getSessionId(){
    var id = SessionAmplify.get("visitor_id");
    if (id == undefined){
      id = Visitor.insert({ created_at: (new Date().getTime() / 1000) });
      SessionAmplify.set("visitor_id", id);
    }
    return id;
  }
  Template.friday.pizzas = function () {
    var query = {};
    if (Template.friday.selectedIngredients().length > 0){
      query.ingredients = {};
      query.ingredients["$all"] = Template.friday.selectedIngredients();
    }
    return Pizza.find(query, { sort: { created_at: -1 } });
  };
  Template.friday.selectedIngredients = function() {
    var i = Session.get("selected_ingredients");
    if (i == undefined) i = new Array();
    return i;
  };
  Template.friday.filteringByIngredients = function() {
    return (Template.friday.selectedIngredients().length > 0);
  };
  
  Template.pizza.style = function(){
    return "background-image:url(" + this.image + ")";
  }
  
  Template.pizza.prettyReviewCount = function(){
    if (Object.keys(this.scores).length == 1) return "Out of 1 Review";
    return "Out of " + Object.keys(this.scores).length.toString() + " Reviews";
  }
  Template.pizza.showAvg = function(){
    return Object.keys(this.scores).length > 0;
  }
  Template.pizza.prettyReviewAvg = function(){
    var t = 0;
    for(var k in this.scores) t += this.scores[k];
    return Math.round((t / Object.keys(this.scores).length) * 10 ) / 10;
  }
  
  Template.pizza.eggplantsWidth = function(){
    var t = 0;
    for(var k in this.scores) t += this.scores[k];
    var pw = ((t / Object.keys(this.scores).length) * 130) / 5;
    return pw.toString() + "px";
  }
    
  Template.scorer.eggplants = function() {
    var ts = getTempScores();
    if (ts[this._id] == undefined) ts[this._id] = 0;
    var s = ts[this._id];
    if (s == 0){
      var id = SessionAmplify.get("visitor_id");
      if (id != undefined && this.scores[id] != undefined) s = this.scores[id];
    }
    var e = [];
    for (var i = 1; i <= 5; i ++){
      e.push({ 
        pizza: this._id, 
        score: i, 
        active: (i <= s ? "active": "")
      });
    }
    return e;
  };
  
  Template.scorer.events({
    'mouseleave .eggplants': function() {
      var s = getTempScores();
      s[this._id] = 0;
      Session.set("temp_scores", s);
    }
  });
  
  Template.eggplant.events({
    'click': function () {
      var s = new Object();
      s["scores." + getSessionId()] = this.score;
      Pizza.update(this.pizza, { $set: s });
    }, 
    'mouseover': function () {
      var s = getTempScores();
      s[this.pizza] = this.score;
      Session.set("temp_scores", s);
    }
  });

  Template.ingredient.events({
    'click': function () {
      var ing = Template.friday.selectedIngredients();
      if (ing.indexOf(this.toString()) == -1) ing.push(this.toString());
      Session.set("selected_ingredients", ing);
      $('body,html').animate({ scrollTop: 0 }, 100);
    }
  });

  Template.selectedIngredient.events({
    'click': function () {
      var ing = Template.friday.selectedIngredients();
      if (ing.indexOf(this.toString()) > -1) ing.splice(ing.indexOf(this.toString()), 1);
      Session.set("selected_ingredients", ing);
    }
  });

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    //do nothing...
  });
}