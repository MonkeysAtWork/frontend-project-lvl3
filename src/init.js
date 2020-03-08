import '@babel/polyfill';


const html = `<body>
  <div class="jumbotron">
    <h1 class="display-4">RSS aggregator</h1>
    <form>
      <div class="form-group">
        <label for="inputRss" class="sr-only">RSS link</label>
        <input type="text" class="form-control" placeholder="RSS link" id="inputRss">
      </div>
      <button type="submit" class="btn btn-primary">Add</button>
    </form>
  </div>
</body>`;

export default () => {
  document.body.innerHTML = html;
};
