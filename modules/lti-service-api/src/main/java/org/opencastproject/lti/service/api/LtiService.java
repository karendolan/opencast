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
package org.opencastproject.lti.service.api;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

public interface LtiService {
  String JOB_TYPE = "org.opencastproject.lti.service";

  /**
   * List currently running jobs for the series
   * @param seriesId ID of the series (optional only if the name is specified instead)
   * @param seriesName Name of the series (optional)
   * @return A list of jobs
   */
  List<LtiJob> listJobs(String seriesName, String seriesId);

  /**
   * Upload a new video
   * @param file File to upload
   * @param captions Subtitles file
   * @param sourceName Name of the source
   * @param seriesId ID of the series (optional only if the name is specified instead)
   * @param seriesName Name of the series (optional)
   * @param metadata Metadata for the event
   */
  void upload(
          InputStream file,
          String captions,
          String sourceName,
          String seriesId,
          String seriesName,
          Map<String, String> metadata);

  LtiEditMetadata editMetadata();

  /**
   * Deletes the specified event
   * @param eventId ID of the event
   */
  void delete(String eventId);
}
