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

package org.opencastproject.analysis.text;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.opencastproject.textextractor.api.TextFrame;
import org.opencastproject.textextractor.tesseract.TesseractTextFrame;

import org.apache.commons.io.IOUtils;
import org.junit.Before;
import org.junit.Test;

import java.io.InputStream;

/**
 * Test case for class {@link TesseractTextFrame}.
 */
public class TesseractTextFrameTest {

  /** Path to the test frame */
  protected String testFile = "/image.txt";

  /** The test frame */
  protected TextFrame textFrame = null;

  /** The text used for the tests */
  protected String text = "Land and Vegetation: Key players on the";

  /** Number of lines on the frame */
  protected int linesOnFrame = 2;

  /**
   * @throws java.lang.Exception
   */
  @Before
  public void setUp() throws Exception {
    InputStream is = null;
    try {
      is = getClass().getResourceAsStream(testFile);
      textFrame = TesseractTextFrame.parse(is);
    } finally {
      IOUtils.closeQuietly(is);
    }
  }

  /**
   * Test method for {@link org.opencastproject.textextractor.tesseract.TesseractTextFrame#getLines()}.
   */
  @Test
  public void testGetText() {
    assertEquals(linesOnFrame, textFrame.getLines().length);
    assertEquals(text, textFrame.getLines()[0].getText());
  }

  /**
   * Test method for {@link org.opencastproject.textextractor.tesseract.TesseractTextFrame#hasText()}.
   */
  @Test
  public void testHasText() {
    assertTrue(textFrame.hasText());
    assertFalse((new TesseractTextFrame()).hasText());
  }

}
