/**
 * Licensed to The Apereo Foundation under one or more contributor license
 * agreements. See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 *
 * The Apereo Foundation licenses this file to you under the Educational
 * Community License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License
 * at:
 *
 *   http://opensource.org/licenses/ecl2.txt
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 */

/* global $, axios, i18ndata, Mustache */
/* exported populateData, refreshEpisodesList, refreshSeriesList */

'use strict';

let currentpage,
    context_label, // The Canvas course instance label
    //#DCE OPC-139, this constant is used in index.html
    // eslint-disable-next-line
    series,
    seriesorig,
    defaultLang = i18ndata['en-US'],
    lang = defaultLang,
    seriesRgbMax = new Array(220, 220, 220), //color range.
    seriesRgbOffset = new Array(20, 20, 20); //darkest possible color;

let eventMap = {};

function matchLanguage(lang) {
  // break for too short codes
  if (lang.length < 2) {
    return defaultLang;
  }
  // Check for exact match
  if (lang in i18ndata) {
    return i18ndata[lang];
  }
  // Check if there is a more specific language (e.g. 'en-US' if 'en' is requested)
  for (const key of Object.keys(i18ndata)) {
    if (key.startsWith(lang)) {
      return i18ndata[key];
    }
  }
  // check if there is a less specific language
  return matchLanguage(lang.substring(0, lang.length - 1));
}

function tryLocalDate(date) {
  try {
    return new Date(date).toLocaleString();
  } catch(err) {
    return date;
  }
}

function i18n(key) {
  return lang[key];
}

function getSeriesQuery() {
  const urlParams = new URLSearchParams(window.location.search);
  let seriesparam = '';
  if (urlParams.has('series')) {
    seriesparam = urlParams.get('series');
  }
  if (!seriesorig) {
    seriesorig = seriesparam;
    $('#series-orig').html(seriesorig);
  }
  return seriesparam;
}

function loadLTIData() {
  return axios.get('/lti');
}

function loadEpisodeSearchInput(q, series, seriestoggle) {
  // render episode filter
  let serieslabel = getCourseCrnLabel(series);
  if (serieslabel.length > 0) {
    serieslabel = `Filtered by ${serieslabel}`;
    seriestoggle = series; // set toggle to be current series
  } else if (seriestoggle && seriestoggle.length > 0) {
    serieslabel = `Filter by ${getCourseCrnLabel(seriestoggle)}`;
  }
  let episodesFilterTemplate = $('#template-episodes-filter').html(),
      episodesFilterTplData = {
        query: q,
        series: series,
        serieslabel: serieslabel,
        seriesorig: seriesorig,
        seriestoggle: seriestoggle,
        seriestoggleCheck: (series && series === seriestoggle) ? 'checked' : '',
        canReset: (q || (seriesorig && seriesorig !== series))
      };
  $('#episodes-searchfield').html(Mustache.render(episodesFilterTemplate, episodesFilterTplData));
}

// render series filter
const loadSeriesSearchInput = (q) => {
  let seriesFilterTemplate = $('#template-series-filter').html(),
      seriesFilterTplData = {
        query: q
      };
  $('#series-searchfield').html(Mustache.render(seriesFilterTemplate, seriesFilterTplData));
};

// #DCE OPC-139
// render series option dropdown, all series
//#DCE OPC-139, this constant is used in index.html
// eslint-disable-next-line
const loadSeriesSelectOptions = () => {
  let seriesFilterTemplate = $('#template-series-option').html(),
      seriesFilterTplData = {};
  $('#series-selectoption').html(Mustache.render(seriesFilterTemplate, seriesFilterTplData));
};

//#DCE OPC-139, this constant is used in index.html
// eslint-disable-next-line
const loadPlayerPreview = (mpID, durationSecs) => {
  //#DCE OPC-139, this constant is used in index.html
  // eslint-disable-next-line
  let selectButtonId = `#populateData-${mpID}`;
  let playerPreviewTemplate = $('#template-player-preview').html(),
      playerPreviewTplData = {
        playerUrl: `/engage/player/watch.html?id=${mpID}`,
        durationSecs: durationSecs,
        mpID: mpID
      };
  $('#episodes-results').html(Mustache.render(playerPreviewTemplate, playerPreviewTplData));
  $('#episodes-pager').html(''); //remove event pagination data
};

//#DCE OPC-139, this constant is used in index.html
// eslint-disable-next-line
const reloadPlayer = (url) => {
  let start, end,
      range = getStartEnd(),
      q = '';
  if (range) {
    start =  parseInt(range[0]);
    end = parseInt(range[1]);
    q = `&start=${start}&end=${end}`;
  }
  $('#player-frame').attr('src', url + q);
};

const getStartEnd = () => {
  if ($('#player-range') && $('#player-range').val()) {
    let range = $('#player-range').val().split('-');
    if (range.length === 2) {
      return [parseInt(range[0]), parseInt(range[1])];
    }
    return null;
  }
};

// =====================================
// Episode Tab
// =====================================

// #DCE OPC-139, this constant is used in index.html
// #DCE OPC_139 the "seriestoggle" is the last search series which
// needs to be preserved (toggle on and off) but not applied in the current query.
// The "seriesorig" is the series originaly assoiated to the LMS course instance.
// eslint-disable-next-line
const loadEpisodesTab = (page, q, series, seriestoggle) => {

  if (!series && !seriestoggle) {
    series = getSeriesQuery();
  }

  let limit = 15,
      offset = (page - 1) * limit,
      url = '/search/episode.json?limit=' + limit + '&offset=' + offset;

  currentpage = page;

  // attach series query if a series is requested
  if (series) {
    url += '&sid=' + series;
  }

  // Create the episode query template. It will be filtered by series if series is known
  // Otherwise, it will be filtered by context_label
  loadEpisodeSearchInput(q, series, seriestoggle);

  // attach free text query if requested
  if (q) {
    url += '&q=' + q;
  }

  // load spinner
  $('#selections').html($('#template-loading').html());

  axios.get(url)
    .then((response) => {
      let data = response.data['search-results'];
      let rendered = '',
          results = [],
          total = parseInt(data.total);

      if (total > 0) {
        results = Array.isArray(data.result) ? data.result : [data.result];
      }

      for (let i = 0; i < results.length; i++) {

        let episode = results[i],
            i18ncreator,
            template = $('#template-episode').html(),
            tpldata,
            attachments;

        // #DCE OPC-139 only take non-live published events
        let tracks = episode.mediapackage.media.track;
        if (!Array.isArray(tracks) || !tracks.length || tracks[0].live) {
          continue;
        }

        if(episode.dcCreator != null) {
          i18ncreator = Mustache.render(i18n('CREATOR'), {creator: episode.dcCreator});
        } else {
          i18ncreator = '';
        }

        tpldata = {
          tool: '/play/' + episode.id,
          // #DCE OPC-139 Canvas ignores ContentItem custom tool param, requires url with params
          // #DCE TODO: add start, end, etc params to end of URL as needed
          url: window.location.origin + '/lti/player/' + episode.id,
          title: episode.dcTitle,
          i18ncreator: i18ncreator,
          created: tryLocalDate(episode.dcCreated),
          seriestitle: episode.mediapackage.seriestitle,
          serieslabel: getCourseCrnLabel(episode.mediapackage.series),
          mpID: episode.id,
          color: generateSeriesColor(episode.mediapackage.series),
          duration: formatDuration(episode.mediapackage.duration),
          durationSecs: episode.mediapackage.duration / 1000};

        // get preview image
        attachments = episode.mediapackage.attachments.attachment;
        attachments = Array.isArray(attachments) ? attachments : [attachments];
        for (let j = 0; j < attachments.length; j++) {
          if (attachments[j].type.endsWith('/player+preview')) {
            tpldata['image'] = attachments[j].url;
            break;
          }
        }

        eventMap[episode.id] = tpldata;

        // render template
        rendered += Mustache.render(template, tpldata);
      }

      // render episode view
      $('#episodes-results').html(rendered);

      // render pagination
      $('#episodes-pager').pagination({
        dataSource: Array(total),
        pageSize: limit,
        pageNumber: currentpage,
        showNavigator: true,
        formatNavigator: '<%= currentPage %> / <%= totalPage %>, <%= totalNumber %> entries',
        callback: function(data, pagination) {
          if (pagination.pageNumber != currentpage) {
            loadEpisodesTab(pagination.pageNumber, q, series, seriestoggle);
          }
        }
      });
    });
};

// =====================================
// Series Tab
// =====================================

function loadSeriesTab(page, q) {
  let limit = 15,
      offset = (page - 1) * limit,
      url = '/search/series.json?limit=' + limit + '&offset=' + offset + '&q=' + q;

  currentpage = page;

  loadSeriesSearchInput(q);

  axios.get(url)
  .then((response) => {
    let data = response.data['search-results'],
        seriestool = 'ltitools/series/index.html?series=',
        rendered = '',
        results = [],
        total = parseInt(data.total);

    if (total > 0) {
      results = Array.isArray(data.result) ? data.result : [data.result];
    }

    for (let i = 0; i < results.length; i++) {
      let serie = results[i],
          template = $('#template-series').html(),
          tpldata = {
            tool: seriestool + serie.id,
            i18ncreator: serie.dcCreator,
            title: serie.dcTitle,
            subject: serie.dcSubject,
            serieslabel: getCourseCrnLabel(serie.id),
            identifier: serie.id,
            created: tryLocalDate(serie.dcCreated),
            image: 'engage/mm/img/logo/opencast-icon.svg',
            color: generateSeriesColor(serie.id)};

      // render template
      rendered += Mustache.render(template, tpldata);
    }

    // render episode view
    $('#series-results').html(rendered);

    // render pagination
    $('#series-pager').pagination({
      dataSource: Array(total),
      pageSize: limit,
      pageNumber: currentpage,
      callback: function(data, pagination) {
        if (pagination.pageNumber != currentpage) {
          loadSeriesTab(pagination.pageNumber, q);
        }
      }
    });
  });
}

// =============================
// Send episode selection
// =============================

const populateData = (mpID) => {
  let data = eventMap[mpID];
  let customData = '';
  // pass required data back to the server
  const urlParams = new URLSearchParams(window.location.search);
  let start, end, range = getStartEnd();
  $('#content_item_return_url').val(urlParams.get('content_item_return_url'));
  $('#consumer_key').val(urlParams.get('consumer_key'));
  if (urlParams.has('data')) {
    $('#data').val(urlParams.get('data'));
  }
  if (urlParams.has('test')) {
    $('#test').val(urlParams.get('test'));
  }

  // retrieve start & end
  if (range) {
    start =  parseInt(range[0]);
    end = parseInt(range[1]);
    customData = `?custom_start=${start}&custom_end=${end}`;
  }

  // generate content_items
  let contentItems = {
    '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
    '@graph': [{
      '@type': 'LtiLinkItem',
      '@id': mpID,
      mediaType: 'application/vnd.ims.lti.v1.ltilink',
      title: data.title,
      text: data.created,
      thumbnail: {
        '@id': data.image,
        'height': '400',
        'width': '700'
      },
      custom: {
        tool: data.tool,
        start: start,
        end: end
      },
      'url': data.url + customData,
      'placementAdvice': {
        'presentationDocumentTarget': 'iframe',
        'displayHeight': '400',
        'displayWidth': '700'
      }
    }]
  };

  $('#content_items').val(JSON.stringify(contentItems).replace(/"/g, '"'));
  document.forms[0].submit();
  return false;
};

//#DCE OPC-139, this constant is called in index.html
// eslint-disable-next-line
const showEpisodesList = (series) => {
  refreshEpisodesList(series);
  $('#episodes-tab a[href="#episodes"]').tab('show');
};

const refreshEpisodesList = (series) => {
  let value = $('#selected-episodes').val();
  let seriestoggle = $('#toggle-series-filter').val();
  // convert 11 digit series number to string
  seriestoggle = seriestoggle ? seriestoggle.toString() : seriestoggle;
  loadEpisodesTab(1, value, series, seriestoggle);
};

//#DCE OPC-139, this constant is called in index.html
// eslint-disable-next-line
const resetEpisodesList = (series) => {
  // remove search query val
  $('#selected-episodes').val('');
  loadEpisodesTab(1, '', series);
};

//#DCE OPC-139, this constant is called in index.html
// eslint-disable-next-line
const toggleSeriesFilter = (seriestoggle) => {
  let seriessearch,
      eventqueryvalue = $('#selected-episodes').val();
  // convert 11 digit series number to string
  seriestoggle = seriestoggle ? seriestoggle.toString() : seriestoggle;
  if ($('#toggle-series-filter').is(':checked')) {
    seriessearch = seriestoggle;
  }
  loadEpisodesTab(1, eventqueryvalue, seriessearch, seriestoggle);
};

const refreshSeriesList = () => {
  let value = $('#selected-series').val();
  loadSeriesTab(1, value);
};

//#DCE OPC-139, this constant is called in index.html
// eslint-disable-next-line
const resetSeriesList = () => {
  // remove search query val
  $('#selected-series').val('');
  loadSeriesTab(1, '');
};

const generateSeriesColor = (id) => {

  if (id == null) {
    return '#fff';
  }

  let rgb = new Array(0, 0, 0);

  for (let i = 0; i < id.length; ++i) {
    rgb[(i % 3)] += id.charCodeAt(i);
  }

  for (let i = 0; i < 3; ++i) {
    rgb[i] = ((rgb[i] % seriesRgbMax[i]) + seriesRgbOffset[i]).toString(16);
    if (rgb[i].length < 1) {
      rgb[i] = '0' + rgb[i];
    }
  }

  return '#' + rgb[0] + rgb[1] + rgb[2];
};

// Convert offeringId into friendly CRN (YYYY-term) text
const getCourseCrnLabel = (offeringId) => {
  let serieslabel = '';
  if (offeringId && offeringId.length === 11) {
    let cnum = offeringId.substring(6,11),
        cyear = offeringId.substring(0,4),
        cterm = offeringId.substring(4,6);
    serieslabel = `CRN ${cnum} (${cyear}-${cterm})`;
  }
  return serieslabel;
};

const formatDuration = (duration) => {
  let seconds = Math.floor((duration / 1000) % 60),
      minutes = Math.floor((duration / (1000 * 60) % 60)),
      hours = Math.floor((duration / (1000 * 60 * 60) % 60));

  if (seconds < 10) {
    seconds = '0' + seconds;
  }
  if (minutes < 10) {
    minutes = '0' + minutes;
  }
  if (hours < 10) {
    hours = '0' + hours;
  }
  return hours + ':' + minutes + ':' + seconds;
};

lang = matchLanguage(navigator.language);

const refreshData = () => {
  axios.all([loadLTIData()])
    .then(axios.spread( function (ltidata) {
      context_label = ltidata.data.context_label ? ltidata.data.context_label : '';
      // #DCE OPC-139 cavas course instance label doesn't help for DCE pubs
      context_label = '';
      series = getSeriesQuery();
      loadEpisodesTab(1, context_label);
      // #DCE OPC-139 allow cross series selection
      loadSeriesTab(1, context_label);
    })
    );
};

refreshData();
