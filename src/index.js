import React, {Fragment} from 'react';
import ReactDOM from 'react-dom';
import fs from 'fs';
import {createElement} from 'glamor/react';
import {createResource} from 'simple-cache-provider';

import withCache from './withCache';
import Timeout from './Timeout';
import Delay from './Delay';

import Img from './Img';
// 
// const { registerObserver } = require('./timeline/src/npm/hook.js');
//
// registerObserver();

const TMDB_API_PATH = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = '762954999d09f9db6ffc6c0e6f37d509';

async function fetchConfig() {
  const response = await fetch(
    `${TMDB_API_PATH}/configuration?api_key=${TMDB_API_KEY}`,
  );
  return await response.json();
}

// From the github commit comments:
// Per our discussion, changes createResource to return an object with read
// and preload methods. Future methods may include set, subscribe, invalidate, and so on.

// so readConfig, readMovieSearchResults, readMovie, and any other variables created by returning
// createResource are objects containing a read and preload method
const readConfig = createResource(fetchConfig);

async function searchMovies(query) {
  const response = await fetch(
    `${TMDB_API_PATH}/search/movie?api_key=${TMDB_API_KEY}&query=${query}&include_adult=false`,
  );
  return await response.json();
}

const readMovieSearchResults = createResource(searchMovies);

async function fetchMovie(id) {
  const response = await fetch(
    `${TMDB_API_PATH}/movie/${id}?api_key=${TMDB_API_KEY}`,
  );
  return await response.json();
}

const readMovie = createResource(fetchMovie);

class AsyncValue extends React.Component {
  // this.props.defaultValue is written inline on the
  // component (check line 266 where component AsyncValue is created)
  state={asyncValue: this.props.defaultValue};
  //
  componentDidMount() {
    ReactDOM.unstable_deferredUpdates(() => {
      this.setState((state, props) => ({asyncValue: props.value}));
    });
  }
  componentDidUpdate(){
    if (this.props.value !== this.state.asyncValue) {
      ReactDOM.unstable_deferredUpdates(() => {
        this.setState((state, props) => ({asyncValue: props.value}));
      });
    }
  }
  render() {
    return this.props.children(this.state.asyncValue);
  }
}

function MasterDetail({header, search, results, details, showDetails}) {
  return (
    <div
      // this type of inline CSS styling is supported by the glamor module
      css={{
        margin: '0 auto',
        width: 500,
        overflow: 'hidden',
        height: '100vh',
        display: 'grid',
        gridTemplateRows: 'min-content auto',
      }}>
      <div>{header}</div>
      <div
        css={[
          {
            width: 1000,
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '36px auto',
            gridTemplateAreas: `
                          'search  details'
                          'results details'
                    `,
            transition: 'transform 350ms ease-in-out',
            transform: 'translateX(0%)',
            overflow: 'hidden',
          },
          showDetails && {
            transform: 'translateX(-50%)',
          },
        ]}>
        <div css={{ gridArea: 'search' }}>{search}</div>
        <div
          css={{
            gridArea: 'results',
            overflow: 'auto',
          }}>
          {results}
        </div>
        <div
          css={{
            gridArea: 'details',
            overflow: 'auto',
          }}>
          {details}
        </div>
      </div>
    </div>
  );
}

function Header() {
  return 'Movie search';
}

function Search({cache, query, onQueryUpdate}) {
  return (
    <input
      onChange={event => onQueryUpdate(event.target.value)}
      value={query}
    />
  )
}

function Result({cache, result, onActiveResultUpdate, isActive}) {
  const config = readConfig(cache);
  const size = config.images.poster_sizes[0];
  const baseURL =
    document.location.protocol === 'https:'
      ? config.images.secure_base_url
      : config.images.base_url;
  const width = parseInt(size.replace(/\w/, ''), 10);
  const height = width / 27 * 40;
  return (
    <button
      onClick={() => onActiveResultUpdate(result)}
      css={[
        {
          background: 'transparent',
          textAlign: 'start',
          display: 'flex',
          width: 'auto',
          outline: 'none',
          border: '1px solid rgba(0,0,0,0.2)',
          cursor: 'pointer',
          padding: 0,
          ':not(:first-child)': {
            borderTop: 'none',
          },
          ':hover': { background: 'lightgray' },
          ':focus': { background: 'lightblue' },
        },
        isActive && {
          background: 'blue',
          ':focus': { background: 'blue' },
        },
      ]}>
      <div
        css={{
          display: 'flex',
          flexGrow: 1,
          position: 'relative',
        }}>
        <div css={{ width, height }}>
          {result.poster_path !== null && (
            <PosterThumbnail src={`${baseURL}/${size}/${result.poster_path}`} />
          )}
        </div>
        <h2 css={{ fontSize: 16 }}>{result.title}</h2>
      </div>
    </button>
  );
}

function PosterThumbnail({ src }) {
  return (
    <Timeout ms={0} fallback={'loading'}>
      <Img src={src} css={{ padding: 0, margin: 0 }} />
    </Timeout>
  );
}

function Results({query, cache, onActiveResultUpdate, activeResult}) {
  if (query.trim() === ''){
    return 'Search for somethin\'';
  }
  const {results} = readMovieSearchResults(cache, query);
  return (
    <div css={{ display: 'flex', flexDirection: 'column' }}>
      {results.slice(0, 5).map(result => {
        return (
          <Result
            key={result.id}
            cache={cache}
            result={result}
            onActiveResultUpdate={onActiveResultUpdate}
            isActive={activeResult !== null && activeResult.id === result.id} // boolean
          />
        );
      })}
    </div>
  );
}

function FullPoster({ cache, movie }) {
  const path = movie.poster_path;
  if (path === null) {
    return null;
  }
  const config = readConfig(cache);
  const size = config.images.poster_sizes[2];
  const baseURL =
    document.location.protocol === 'https:'
      ? config.images.secure_base_url
      : config.images.base_url;
  const width = size.replace(/\w/, '');
  const src = `${baseURL}/${size}/${movie.poster_path}`;
  return (
    <Timeout ms={2000}>
      <Img width={width} src={src} />
    </Timeout>
  );
}

function MovieInfo({ movie, cache, clearActiveResult }) {
  const fullResult = readMovie(cache, movie.id);
  return (
    <Fragment>
      <FullPoster cache={cache} movie={movie} />
      <h2>{movie.title}</h2>
      <div>{movie.overview}</div>
    </Fragment>
  );
}

function Details({result, clearActiveResult, cache}) {
  return (
    <Fragment>
      <div>
        <button onClick={() => clearActiveResult()}>Back</button>
      </div>
      <MovieInfo movie={result} cache={cache} />
    </Fragment>
  )
}

class MoviesImpl extends React.Component {
  state = {
    query: '',
    activeResult: null,
  };
  onQueryUpdate = query => {
    this.setState({query});
    // requestIdleCallback(() => console.log(query));
  };
  onActiveResultUpdate = activeResult => this.setState({ activeResult });
  clearActiveResult = () => this.setState({ activeResult: null });
  render() {
    const cache = this.props.cache;
    const state = this.state;
    // Important: there are high-pri (~sync) and low-pri versions of most of
    // the state in this component. The high-pri ones will *immediately* (<1sec) trigger
    // a timeout. The low-pri ones have a default timeout of ~5 seconds. High-pri
    // is only for things that need to update quickly, like a text input. Anything
    // that might cause the render to suspend should use the low-pri (async) values.
    return (
      <AsyncValue value={state} defaultValue={{query: '', activeResult: null}}>
        {asyncState => (
          // MasterDetail renders the details about the movie provided by the AsyncValue
          // component it's wrapped in
          <MasterDetail
            header={<Header />}
            search={
              <div>
                <Search
                  // query is the value displayed in the input
                  query={state.query}
                  // onQueryUpdate can be any function, it will be passed the input's event.target.value onChange
                  // in this case we're passing it the function query => this.setState({query}), so
                  // onChange sends event.target.value to state.query
                  onQueryUpdate={this.onQueryUpdate}
                  />
              </div>
            }
            results={
              <Results
                // asyncState is the argument passed from the state of the <AsyncValue> wrapper
                // asyncState is the variable that is updated based on the new priority queueing system (deferredUpdates())
                query={asyncState.query}
                cache={cache}
                onActiveResultUpdate={this.onActiveResultUpdate}
                activeResult={state.activeResult}
                />
            }
            details={
              asyncState.activeResult && (
                <Fragment>
                  <Details
                    cache={cache}
                    clearActiveResult={this.clearActiveResult}
                    result={asyncState.activeResult}
                  />
                </Fragment>
              )
            }
            showDetails={asyncState.activeResult !== null}
          />
        )}
      </AsyncValue>
    );
  }
}

const Movies = withCache(MoviesImpl);

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<Movies />);
