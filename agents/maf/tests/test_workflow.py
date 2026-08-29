import unittest

from kairos_maf.workflow import parse_structured_analysis


class WorkflowContractTests(unittest.TestCase):
    def test_structured_analysis_is_bounded_and_requires_evidence(self):
        result = parse_structured_analysis(
            '{"analysisId":"a","agent":"technical","instrumentId":"ins_a",'
            '"signal":"bullish","horizon":"short_term","thesis":"trend",'
            '"confidence":0.8,"evidenceIds":["e1"]}'
        )
        self.assertEqual(result["confidence"], 0.8)

        with self.assertRaisesRegex(ValueError, "evidenceIds"):
            parse_structured_analysis(
                '{"analysisId":"a","agent":"technical","instrumentId":"ins_a",'
                '"signal":"bullish","horizon":"short_term","thesis":"trend",'
                '"confidence":0.8}'
            )


if __name__ == "__main__":
    unittest.main()
